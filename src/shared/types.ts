
type Point = { x : number, y : number }
type Rotating = { angle : number }
type RotatingPoint = Point & Rotating

type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  nomination : [boolean, string]
  gameTick : GameTickMessage
  removedPlayer : string
  // newBullets : NewBulletsForClientsMessage
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  nomination : string
  controlsInput : PlayerControlsMessage
  // newBullets : NewBulletForServerMessage
  
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
  angle : number
  isPressingTrigger : boolean
  messageNumber : number
  deltaTime : number
}

type SocketPlayer = {
  x : number
  y : number
  angle : number
  score : number
  name : string
  lastTimeGettingShot : number
  lastProcessedInput : number
  // isSpeaking : boolean
}

type SocketBullet = {
  x : number
  y : number
  speedX : number
  speedY : number
  id : number
}

type GameTickMessage = {
  players : SocketPlayer[]
  bullets : SocketBullet[]
  newBullets : SocketBullet[]
}

// type NewBulletForServerMessage = {
//   x : number
//   y : number
//   speedX : number
//   speedY : number
//   timeFired : number
//   owner : string
//   id : number
// }

// type NewBulletsForClientsMessage = {
//   x : number
//   y : number
//   speedX : number
//   speedY : number
//   timeFired : number
//   id : number
// }[]
