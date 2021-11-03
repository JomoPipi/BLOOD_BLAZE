
type Point = { x : number, y : number }
type Rotating = { angle : number }
type RotatingPoint = Point & Rotating
type Circle = Point & { r : number }
type LineSegment = [Point,Point]

type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  readonly nomination : [boolean, string]
  readonly gameTick : GameTickMessage
  readonly removedPlayer : string
  readonly mapdata : Record<WallType, LineSegment[]>
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  readonly nomination : string
  readonly controlsInput : PlayerControlsMessage
  readonly networkLatency : number

  // Builtin events
  readonly ping : Function
  readonly connection : ServerSocket
  readonly disconnect : never
}

type GameTickMessage = {
  readonly players : SocketPlayer[]
  readonly bulletsToAdd : SocketBullet[]
  readonly bulletsToDelete : Record<number, true>
} 

interface ServerSocket {
  on <T extends ClientToServerSocketEvents>
    (event : T, fn : (x : ClientToServerMessageTypes[T]) => void) : void

  once <T extends ClientToServerSocketEvents>
    (event : T, fn : (x : ClientToServerMessageTypes[T]) => void) : void

  emit <T extends ServerToClientSocketEvents>
    (event : T, data : ServerToClientMessageTypes[T]) : void

  removeAllListeners(e : keyof ClientToServerMessageTypes) : void
}

interface ClientSocket {
  on <T extends ServerToClientSocketEvents>
    (event : T, fn : (x : ServerToClientMessageTypes[T]) => void) : void

  once <T extends ServerToClientSocketEvents>
    (event : T, fn : (x : ServerToClientMessageTypes[T]) => void) : void

  emit <T extends ClientToServerSocketEvents>
    (event : T, data : ClientToServerMessageTypes[T]) : void

  removeAllListeners(x : keyof ServerToClientMessageTypes) : void

  volatile : Omit<ClientSocket, 'volatile'>
}

type Joystick = Point

type PlayerControlsMessage = { 
  x : number
  y : number
  angle : number
  messageNumber : number
  deltaTime : number
  requestedBullet? : SocketBullet
}

type SocketPlayer = {
  x : number
  y : number
  angle : number
  score : number
  name : string
  lastTimeGettingShot : number
  lastProcessedInput : number
  controls : Point
  latency : number
  health : number
  isImmune : boolean
  // isSpeaking : boolean
}

type SocketBullet = {
  x : number
  y : number
  readonly speedX : number
  readonly speedY : number
  readonly id : number
  readonly shooter : string
  readonly expirationDistance : number
}

type Rectangle = {
  x : number
  y : number
  w : number
  h : number
}
