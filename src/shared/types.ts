
type Point = { x : number, y : number }

type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  nomination : [boolean, string]
  gameTick : GameTickMessage
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  nomination : string
  controlsInput : PlayerControls
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
type PlayerControls = { 
  joystick : Point
  shootingAngle : number
  isShooting : boolean
  n : number
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
}
type GameTickMessage = 
  { players : SocketPlayer[]
  , bullets : Point[]
  , tick : number
  }

// interface ObjectConstructor {
//   keys<set extends string>(o : { readonly [key in set] : any }) : set[]
// }