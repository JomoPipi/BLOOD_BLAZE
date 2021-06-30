
type Point = { x : number, y : number }
// type BasePlayer = {
//   x : number
//   y : number
//   lastTimeShooting : number
// }

type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  nomination : [boolean, string]
  gameTick : GameTickMessage
  removedPlayer : string
  newBullets : NewBulletsForClientsMessage
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  nomination : string
  controlsInput : PlayerControlsMessage
  newBullets : NewBulletForServerMessage
  
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
  isPressingTrigger : boolean
  // nowShooting : boolean
  timeSent : number
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
  lastTimeGettingShot : number
  name : string
  score : number
  lastProcessedInput : number
}

type GameTickMessage = {
  players : SocketPlayer[]
  bullets : Point[] // (Point & { speedX : number, speedY : number, timeFired : number })[]
}

type NewBulletForServerMessage = {
  x : number
  y : number
  speedX : number
  speedY : number
  timeFired : number
  owner : string
  id : number
}

type NewBulletsForClientsMessage = {
  x : number
  y : number
  speedX : number
  speedY : number
  timeFired : number
  id : number
}[]


// interface ObjectConstructor {
//   keys<set extends string>(o : { readonly [key in set] : any }) : set[]
// }
