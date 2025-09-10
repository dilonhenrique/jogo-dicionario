import { useCallback, useEffect, useRef } from "react";
import { useRoomChannel } from "../contexts/RoomContext";

type ApplyFn<P> = (payload: P) => void;
type MapFn<I, P> = (input: I) => P;

type Props<I, P> = {
  event: string;
  apply: ApplyFn<P>;
  mapInput?: MapFn<I, P>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDispatcher<I = any, P = I>({ apply, event, mapInput }: Props<I, P>) {
  const { channel } = useRoomChannel();

  const applyRef = useRef<ApplyFn<P>>(apply);
  const mapRef = useRef<MapFn<I, P> | undefined>(mapInput);
  const eventRef = useRef(event);

  useEffect(() => { applyRef.current = apply; }, [apply]);
  useEffect(() => { mapRef.current = mapInput; }, [mapInput]);
  useEffect(() => { eventRef.current = event; }, [event]);

  useEffect(() => {
    const event = eventRef.current;
    channel.on("broadcast", { event }, ({ payload }) => {
      applyRef.current(payload as P);
    });
  }, [channel]);

  const dispatch = useCallback((input: I) => {
    const payload = mapRef.current ? mapRef.current(input) : (input as unknown as P);
    applyRef.current(payload);
    channel.send({ type: "broadcast", event: eventRef.current, payload });
  }, [channel]);

  return dispatch;
}
