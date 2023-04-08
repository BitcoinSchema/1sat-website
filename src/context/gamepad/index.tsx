import React, { ReactNode, useContext, useMemo, useState } from "react";
import Gamepad from "react-gamepad";

type ContextValue = {
  lastPressed: string | undefined;
};

const GamepadContext = React.createContext<ContextValue | undefined>(undefined);

type Props = {
  children?: ReactNode;
};

export const GamepadProvider: React.FC<Props> = (props) => {
  const [lastPressed, setLastPressed] = useState<string | undefined>(undefined);

  const connectHandler = (gamepadIndex: number) => {
    console.log(`Gamepad ${gamepadIndex} connected !`);
  };

  const disconnectHandler = (gamepadIndex: number) => {
    console.log(`Gamepad ${gamepadIndex} disconnected !`);
  };

  const buttonChangeHandler = (buttonName: string, down: boolean) => {
    console.log(buttonName, down);

    if (down) {
      buttonDownHandler(buttonName);
      setLastPressed(buttonName);
    } else {
      buttonUpHandler(buttonName);
    }
  };

  const axisChangeHandler = (
    axisName: string,
    value: number,
    previousValue: number
  ) => {
    console.log(axisName, value);
  };

  const buttonDownHandler = (buttonName: string) => {
    console.log(buttonName, "down");
  };

  const buttonUpHandler = (buttonName: string) => {
    console.log(buttonName, "up");
  };

  const value = useMemo(
    () => ({
      lastPressed,
    }),
    [lastPressed]
  );

  return (
    <GamepadContext.Provider value={value} {...props}>
      <Gamepad
        onConnect={connectHandler}
        onDisconnect={disconnectHandler}
        onButtonChange={buttonChangeHandler}
        onAxisChange={axisChangeHandler}
      >
        <></>
      </Gamepad>
    </GamepadContext.Provider>
  );
};

export const useGamepad = (): ContextValue => {
  const context = useContext(GamepadContext);
  if (context === undefined) {
    throw new Error("Gamepad must be used within an GamepadProvider");
  }
  return context;
};
