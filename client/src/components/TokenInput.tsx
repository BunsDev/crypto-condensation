import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ethBalance, tokenBalance } from "../services/contracthelper";
import { toCents } from "../services/web3Service";
import Input from "./Input";
import { ValidationError } from "../styles/ValidationError";
import Token from "../types/Token";
import TokenSelector from "./TokenSelector";

const StyledTokenInput = styled.div`
  border-radius: 2rem;
  display: flex;
  padding-top: 1rem;
`;

const Container = styled.div`
  display: flex;
  padding: 1rem;
  border: solid 2px var(--main);
  align-items: center;
  width: 13rem;
  position: relative;
  margin-right: 3rem;
  height: 4.8rem;
`;

const OpenButton = styled.button`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer;
`;

const Image = styled.img`
  height: 1.6rem;
  margin-right: 1rem;
  background-color: var(--bg);
  border-radius: 50%;
`;

const Name = styled.div`
  color: var(--main);
  font-size: 1.6rem;
  font-weight: 500;
  margin-right: 1rem;
`;

const Arrow = styled.div`
  font-size: 2rem;
  color: var(--main);
  position: absolute;
  font-weight: 200;
  font-family: Arial, Helvetica, sans-serif;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%) rotate(90deg);
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const MaxButton = styled.button`
  font-size: 1.9rem;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 600;
  position: absolute;
  right: 1rem;
  top: 1.4rem;
  cursor: pointer;
  height: 2rem;
  background-color: var(--bg);
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RemoveAsset = styled.button`
  font-size: 1.9rem;
  font-weight: 500;
  color: var(--primary);
  text-decoration: underline;
  width: 9rem;
  cursor: pointer;
  margin-left: 1rem;
`;

type Props = {
  token: Token;
  setToken: (token: Token, value: string) => void;
  removeToken: () => void;
  removable: boolean;
};

const TokenInput = (props: Props): JSX.Element => {
  const tokenContainerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("0");
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  const updateBalance = async (token: Token) => {
    if (token.address === "ETH") {
      const _balance = await ethBalance();
      setBalance(_balance);
    } else {
      const _balance = await tokenBalance(token);
      setBalance(_balance);
    }
  };

  const setToken = (
    token: Token,
    valueString: string,
    isTokenChange: boolean
  ) => {
    setError("");
    if (!isTokenChange) {
      let number = "0";
      try {
        number = toCents(Number.parseFloat(valueString), token);
      } catch {
        setError("Not a valid number");
        return;
      }
      if (Number.parseFloat(number) === 0) {
        setError("Value must be greater than 0");
        return;
      }
      if (Number.parseFloat(valueString) > balance) {
        setError("Value must be less than or equal to balance");
        return;
      }
    }
    props.setToken(token, valueString);
  };

  useEffect(() => {
    updateBalance(props.token);
  }, []);

  return (
    <StyledTokenInput>
      <Container ref={tokenContainerRef}>
        <Image
          src={props.token.logoURI}
          alt={`${props.token.symbol} Token Image`}
        />
        <Name>{props.token.symbol}</Name>
        <Arrow>{">"}</Arrow>
        <OpenButton onClick={() => setOpen(true)} />
        <TokenSelector
          open={open}
          token={props.token}
          setToken={(token: Token) => {
            setToken(token, value, true);
            updateBalance(token);
            setOpen(false);
          }}
          parent={tokenContainerRef.current}
        />
      </Container>
      <InputContainer>
        <Input
          placeholder="0.0"
          value={value}
          setValue={(v: string) => {
            setValue(v);
            setToken(props.token, v, false);
          }}
        />
        <MaxButton onClick={() => setValue(balance.toString())}>max</MaxButton>
        {error && <ValidationError spacing>{error}</ValidationError>}
      </InputContainer>
      {props.removable && (
        <RemoveAsset onClick={() => props.removeToken()}>Remove</RemoveAsset>
      )}
    </StyledTokenInput>
  );
};

export default TokenInput;
