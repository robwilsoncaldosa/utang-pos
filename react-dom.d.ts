import "react-dom";

declare module "react-dom" {
  export function useFormState<State, Payload>(
    action: (state: State, payload: Payload) => State | Promise<State>,
    initialState: State,
    permalink?: string
  ): [State, (payload: Payload) => void];
}
