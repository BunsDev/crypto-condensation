import React from "react";
import styled from "styled-components";
import { BooleanLiteral } from "typescript";

const StyledCreateCapsule = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  width: 600px;
  display: flex;
  flex-direction: column;
  padding: 30px;
  background-color: white;
`;

type Props = {
  open: boolean;
  close: () => void;
};

const CreateCapsule = (props: Props) => {
  if (!props.open) return null;

  return (
    <StyledCreateCapsule>
      <Container>meow</Container>
    </StyledCreateCapsule>
  );
};

export default CreateCapsule;
