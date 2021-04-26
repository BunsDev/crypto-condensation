import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ethBalance, tokenBalance } from "../services/contracthelper";
import Input from "../styles/Input";
import Token from "../types/Token";
import TokenSelector from "./TokenSelector";

const StyledTokenInput = styled.div`
  border-radius: 2rem;
  display: flex;
  padding-top: 2rem;
`;

const Container = styled.div`
  display: flex;
  padding: 1rem 0.7rem;
  align-items: center;
  border: solid 1px var(--sub);
  border-radius: 1rem;
  width: 14rem;
  position: relative;
  margin-right: 3rem;
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
  height: 2.4rem;
  margin-right: 0.7rem;
  background-color: var(--white);
  border-radius: 50%;
`;

const Name = styled.div`
  color: var(--main);
  font-size: 2rem;
  font-weight: 500;
  margin-right: 1rem;
`;

const Arrow = styled.div`
  transform: rotate(90deg);
  font-size: 2rem;
  color: var(--sub);
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const MaxButton = styled.button`
  font-size: 1.4rem;
  text-transform: uppercase;
  color: var(--primary);
  font-weight: 600;
  position: absolute;
  right: 1rem;
  top: 0;
  cursor: pointer;
  height: 100%;
`;

const RemoveAsset = styled.button`
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--primary);
  text-decoration: underline;
  width: 9rem;
  cursor: pointer;
  margin-left: 1rem;
`;

type Props = {
  token: Token;
  setToken: (token: Token, value: number) => void;
  removeToken: () => void;
  removable: boolean;
};

const TokenInput = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("0");
  const [balance, setBalance] = useState(0);

  const updateBalance = async (token: Token) => {
    if (token.address === "ETH") {
      const _balance = await ethBalance();
      setBalance(_balance);
    } else {
      console.log(token.address);
      const _balance = await tokenBalance(token);
      setBalance(_balance);
    }
  };

  useEffect(() => {
    updateBalance(props.token);
  }, []);

  return (
    <StyledTokenInput>
      <Container>
        <Image src={props.token.logoURI} />
        <Name>{props.token.symbol}</Name>
        <Arrow>{">"}</Arrow>
        <OpenButton onClick={() => setOpen(true)} />
        <TokenSelector
          open={open}
          token={props.token}
          setToken={(token: Token) => {
            props.setToken(token, Number.parseFloat(value));
            updateBalance(token);
            setOpen(false);
          }}
        />
      </Container>
      <InputContainer>
        <Input
          placeholder="0.0"
          value={value}
          onChange={(e: any) => {
            setValue(e.target.value);
            props.setToken(props.token, Number.parseFloat(e.target.value));
          }}
        />
        <MaxButton onClick={() => setValue(balance.toString())}>max</MaxButton>
      </InputContainer>
      {props.removable && (
        <RemoveAsset onClick={() => props.removeToken()}>Remove</RemoveAsset>
      )}
    </StyledTokenInput>
  );
};

export default TokenInput;
