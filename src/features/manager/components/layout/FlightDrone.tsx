import { Lottie } from 'lottie-react'

import droneAnimation from '../../../landing/assets/drone-animation.json'

export default function FlightDrone({ animate }: { animate: boolean }) {
  return (
    <Lottie
      src={droneAnimation}
      autoplay={animate}
      loop={animate}
      className="mgr-flight-drone"
    />
  )
}
