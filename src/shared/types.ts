
type Point = { x : number, y : number }

type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  nomination : [boolean, string]
  gameTick : GameTickMessage
  removedPlayer : string
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  nomination : string
  controlsInput : PlayerControlsMessage
  
  connection : ServerSocket
  disconnect : never
}

interface ServerSocket {
  on <T extends ClientToServerSocketEvents>
    (event : T, fn : (x : ClientToServerMessageTypes[T]) => void) : void

  once <T extends ClientToServerSocketEvents>
    (event : T, fn : (x : ClientToServerMessageTypes[T]) => void) : void

  emit <T extends ServerToClientSocketEvents>
    (event : T, data : ServerToClientMessageTypes[T]) : void
}

interface ClientSocket {
  on <T extends ServerToClientSocketEvents>
    (event : T, fn : (x : ServerToClientMessageTypes[T]) => void) : void

  once <T extends ServerToClientSocketEvents>
    (event : T, fn : (x : ServerToClientMessageTypes[T]) => void) : void

  emit <T extends ClientToServerSocketEvents>
    (event : T, data : ClientToServerMessageTypes[T]) : void
}

type Joystick = Point
type PlayerControlsMessage = { 
  x : number
  y : number
  shootingAngle : number
  isShooting : boolean
  toggleShootingTimestamp : number
  messageNumber : number
  deltaTime : number
}
// type ControlsInput = {
//   leftJoystick : Joystick,
//   rightThumbpad : { angle : number }
//   isShooting : boolean
//   n : number
// }

type SocketPlayer = {
  x : number
  y : number
  angle : number
  // isSpeaking : boolean
  isShooting : boolean
  isGettingShot : boolean
  name : string
  score : number
  lastProcessedInput : number
}
type GameTickMessage = 
  { players : SocketPlayer[]
  , bullets : Point[] // (Point & { speedX : number, speedY : number, timeFired : number })[]
  }

// interface ObjectConstructor {
//   keys<set extends string>(o : { readonly [key in set] : any }) : set[]
// }