import React from "react";
import styled from "styled-components";
import CreateCapsule from "./CreateCapsule";
import Footer from "./Footer";
import Header from "./Header";

const StyledCreatePage = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const CreatePage = () => {
  return (
    <StyledCreatePage>
      <Header />
      <CreateCapsule />
      <Footer />
    </StyledCreatePage>
  );
};

export default CreatePage;
