"""
V10 Real Speech-to-Text (Qwen3-ASR-0.6B) & WER/CER Evaluation Harness.

Reads ACTUAL generated 16kHz WAV files from `ai-training/datasets/voice/audio-manifest.jsonl`,
feeds raw WAV bytes into the production `speech_transcription.transcribe()` pipeline,
measures real WER, CER, latency, and saves results to `ai-training/reports/v10-real-asr-results.json`.
"""
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

FE_ROOT = Path(__file__).resolve().parents[2]
BE_VOICE_DIR = FE_ROOT.parent / "on-demand-monitoring-system" / "Python" / "voice-order"
sys.path.insert(0, str(BE_VOICE_DIR))

import speech_transcription  # noqa: E402

MANIFEST = FE_ROOT / "ai-training" / "datasets" / "voice" / "audio-manifest.jsonl"
OUT_REPORT = FE_ROOT / "ai-training" / "reports" / "v10-real-asr-results.json"


def norm_words(s: str) -> list[str]:
    cleaned = re.sub(r"[^\w\s]", " ", s.lower(), flags=re.U)
    return [w for w in cleaned.split() if w]


def levenshtein(a: list[str] | str, b: list[str] | str) -> int:
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            cur = dp[j]
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
            prev = cur
    return dp[n]


def wer(ref: str, hyp: str) -> float:
    rw, hw = norm_words(ref), norm_words(hyp)
    if not rw:
        return 0.0
    return round(levenshtein(rw, hw) / len(rw), 4)


def cer(ref: str, hyp: str) -> float:
    rc = " ".join(norm_words(ref))
    hc = " ".join(norm_words(hyp))
    if not rc:
        return 0.0
    return round(levenshtein(rc, hc) / len(rc), 4)


def main() -> None:
    if not MANIFEST.exists():
        raise FileNotFoundError(f"Missing {MANIFEST}. Run generate_audio_fixtures.py first.")
    if not speech_transcription.configured():
        raise RuntimeError("Production Qwen3-ASR-0.6B model is not configured on this machine.")

    items = [json.loads(line) for line in MANIFEST.read_text(encoding="utf-8").splitlines() if line.strip()]
    results = []
    for item in items:
        wav_path = Path(item["audioPath"])
        wav_bytes = wav_path.read_bytes()
        t0 = time.perf_counter()
        try:
            raw_res = speech_transcription.transcribe(wav_bytes, "audio/wav")
            hyp = (
                (raw_res.get("text") or raw_res.get("transcript") or "")
                if isinstance(raw_res, dict)
                else str(raw_res)
            ).strip()
            err = None
        except Exception as exc:  # noqa: BLE001
            hyp = ""
            err = str(exc)
        latency_ms = round((time.perf_counter() - t0) * 1000.0, 1)
        w = wer(item["text"], hyp) if not err else 1.0
        c = cer(item["text"], hyp) if not err else 1.0
        results.append(
            {
                **item,
                "recognizedTranscript": hyp,
                "error": err,
                "wer": w,
                "cer": c,
                "asrLatencyMs": latency_ms,
            }
        )
        print(f"  [{item['id']}] ({item['condition']}) WER={w:.2%} | {latency_ms}ms | '{hyp}'")

    clean_rows = [r for r in results if r["condition"] != "noisy"]
    noisy_rows = [r for r in results if r["condition"] == "noisy"]
    avg = lambda arr, k: round(sum(x[k] for x in arr) / max(1, len(arr)), 4)

    report = {
        "evaluatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "asrProvider": "Qwen3-ASR-0.6B (production speech_transcription.py)",
        "totalAudioFiles": len(results),
        "cleanAudioCount": len(clean_rows),
        "noisyAudioCount": len(noisy_rows),
        "cleanAvgWer": avg(clean_rows, "wer"),
        "cleanAvgCer": avg(clean_rows, "cer"),
        "noisyAvgWer": avg(noisy_rows, "wer"),
        "noisyAvgCer": avg(noisy_rows, "cer"),
        "avgAsrLatencyMs": avg(results, "asrLatencyMs"),
        "results": results,
    }
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"[v10-real-asr] Evaluated {len(results)} real WAVs | clean WER={report['cleanAvgWer']:.2%} | noisy WER={report['noisyAvgWer']:.2%} | avgLatency={report['avgAsrLatencyMs']}ms"
    )


if __name__ == "__main__":
    main()
