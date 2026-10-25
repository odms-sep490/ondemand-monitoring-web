import { useEffect, useState } from 'react'
import type { Mission, Drone } from '../../types/omss'
import { MissionBadge, DroneBadge } from './StatusBadge'

interface Props {
  mission: Mission
  drone: Drone
}

function TelCell({
  label,
  value,
  unit,
  warn,
  crit,
}: {
  label: string
  value: string
  unit?: string
  warn?: boolean
  crit?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 14px',
        height: '100%',
        borderRight: '1px solid #1a1f2e',
        minWidth: 64,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: '#2e3448',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-data)',
          fontWeight: 600,
          lineHeight: 1,
          marginTop: 3,
          color: crit ? '#f87171' : warn ? '#fbbf24' : '#e2e6f0',
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 9, color: '#4e5670', marginLeft: 1 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default function MissionHeader({ mission, drone }: Props) {
  const [utc, setUtc] = useState('')
  useEffect(() => {
    const tick = () => setUtc(new Date().toISOString().slice(11, 19))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        background: '#0d1019',
        borderBottom: '1px solid #1a1f2e',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      {/* Mission identity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderRight: '1px solid #1a1f2e',
          minWidth: 0,
          flex: '0 1 380px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-data)',
                color: '#4e5670',
              }}
            >
              {mission.id}
            </span>
            <MissionBadge state={mission.state} />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e2e6f0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {mission.title}
          </div>
        </div>
      </div>

      {/* Drone identity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderRight: '1px solid #1a1f2e',
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#4e5670"
          strokeWidth="1.3"
        >
          <circle cx="10" cy="10" r="3" />
          <path d="M4 4l2.5 2.5M16 4l-2.5 2.5M4 16l2.5-2.5M16 16l-2.5-2.5" />
          <circle cx="4" cy="4" r="2" />
          <circle cx="16" cy="4" r="2" />
          <circle cx="4" cy="16" r="2" />
          <circle cx="16" cy="16" r="2" />
        </svg>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-data)',
                color: '#4e5670',
              }}
            >
              {drone.name || drone.id}
            </span>
            <DroneBadge state={drone.state} />
          </div>
          <div style={{ fontSize: 11, color: '#8892a8' }}>{drone.model}</div>
        </div>
      </div>

      {/* Live telemetry strip */}
      <div
        style={{ display: 'flex', alignItems: 'stretch', marginLeft: 'auto' }}
      >
        <TelCell
          label="BAT"
          value={`${Math.round(drone.battery)}%`}
          warn={drone.battery < 40}
          crit={drone.battery < 25}
        />
        <TelCell
          label="SAT"
          value={`${drone.gpsCount}`}
          warn={drone.gpsCount < 8}
        />
        <TelCell label="RSSI" value={`${drone.rssi}%`} warn={drone.rssi < 60} />
        <TelCell label="ALT" value={drone.altitude.toFixed(0)} unit="m" />
        <TelCell label="SPD" value={drone.groundSpeed.toFixed(1)} unit="m/s" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            minWidth: 72,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: '#2e3448',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            UTC
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-data)',
              fontWeight: 500,
              color: '#8892a8',
              lineHeight: 1,
              marginTop: 3,
            }}
          >
            {utc}
          </div>
        </div>
      </div>
    </header>
  )
}
