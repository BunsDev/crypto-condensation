import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { selectTokens } from "../state/tokenSlice";
import Input from "./Input";
import Token from "../types/Token";

type DisplayProps = {
  show: boolean;
};

const StyledTokenSelector = styled.div`
  display: ${(props: DisplayProps) => (props.show ? "flex" : "none")};
`;

type ContainerProps = {
  top: number;
  left: number;
};

const Container = styled.div`
  position: fixed;
  top: ${(props: ContainerProps) => `calc(${props.top}px - 1px)`};
  left: ${(props: ContainerProps) => `calc(${props.left}px - 1px)`};
  width: 25rem;
  padding: 1.7rem;
  border-radius: 1rem;
  background-color: var(--bg);
  color: var(--main);
  font-size: 1.5rem;
  z-index: 1;
`;

const ExitEvent = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 1;
`;

const Tokens = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  z-index: 2;
`;

const TokenContainer = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.8rem;

  :hover {
    background-color: var(--primary-light);
  }
`;

const Image = styled.img`
  width: 2.4rem;
  margin-right: 2rem;
  background-color: var(--bg);
  border-radius: 50%;
`;

const Name = styled.div`
  color: var(--main);
  font-size: 1.4rem;
  font-weight: 500;
  margin-right: 1rem;
`;

type Props = {
  open: boolean;
  token: Token;
  setToken: (token: Token) => void;
  parent: HTMLDivElement | null;
};

const TokenSelector = (props: Props): JSX.Element => {
  const tokens = useSelector(selectTokens);
  const [search, setSearch] = useState("");

  return (
    <StyledTokenSelector show={props.open}>
      <ExitEvent onClick={() => props.setToken(props.token)} />
      <Container
        top={props.parent ? props.parent.getBoundingClientRect().top : 0}
        left={props.parent ? props.parent.getBoundingClientRect().left : 0}
      >
        <Input
          placeholder="Search name"
          value={search}
          setValue={(value: string) => setSearch(value)}
        />
        <Tokens>
          {tokens
            .filter((token: Token) => {
              if (!search) return true;
              return (
                token.name.substring(0, search.length).toLowerCase() ===
                search.toLowerCase()
              );
            })
            .slice(0, 10)
            .map((token: Token) => (
              <TokenContainer
                key={token.address}
                onClick={() => props.setToken(token)}
              >
                <Image
                  src={token.logoURI}
                  alt={`${props.token.symbol} Token Image`}
                />
                <Name>{token.name}</Name>
              </TokenContainer>
            ))}
        </Tokens>
      </Container>
    </StyledTokenSelector>
  );
};

export default TokenSelector;
