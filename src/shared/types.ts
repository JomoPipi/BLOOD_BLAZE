
type ServerToClientSocketEvents = keyof ServerToClientMessageTypes
type ServerToClientMessageTypes = {
  nomination : [boolean, string]
  renderGameLoop : FrequentRenderData
}

type ClientToServerSocketEvents = keyof ClientToServerMessageTypes
type ClientToServerMessageTypes = {
  nomination : string
  controlsInput : ControlsInput
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

type Joystick = { x : number, y : number }//, active : boolean }
type ControlsInput = Partial<{
  leftJoystick : Joystick,
  rightThumbpad : { angle : number }
  isShooting : boolean
  // rightJoyStick : Joystick
  // isReloading : boolean
}>

interface FrequentPlayerRenderData {
  x : number
  y : number
  angle : number
  // isSpeaking : boolean
  isShooting : boolean
  isGettingShot : boolean
}
type FrequentRenderData = [Record<string, FrequentPlayerRenderData>, { x : number, y : number }[]]

// interface ObjectConstructor {
//   keys<set extends string>(o : { readonly [key in set] : any }) : set[]
// }