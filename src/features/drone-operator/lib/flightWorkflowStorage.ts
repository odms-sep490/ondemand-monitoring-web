export function backendPreflightTokenStorageKey(
  missionId: string,
  droneLabel: string,
) {
  return `omss.droneOperator.backendPreflightToken.${missionId}.${droneLabel}`
}

export function preflightReadyStorageKey(
  missionIdOrCode: string,
  droneLabel: string,
) {
  return `omss.droneOperator.preflightReady.${missionIdOrCode}.${droneLabel}`
}

export function handoverAcknowledgedStorageKey(missionId: string) {
  return `fieldwise.operator.handoverAcknowledged.${missionId}`
}

export function hasAcknowledgedHandover(missionId: string) {
  return window.sessionStorage.getItem(
    handoverAcknowledgedStorageKey(missionId),
  ) === 'true'
}
