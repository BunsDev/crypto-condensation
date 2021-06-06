import React from "react";
import styled from "styled-components";
import Landing from "./Landing";
import SupportedNetworks from "./SupportedNetworks";
import TokenSlide from "./TokenSlide";
import WhatIsSlide from "./WhatIsSlide";
import WhyUseSlide from "./WhyUseSlide";

const StyledHomePage = styled.div`
  display: flex;
  flex-direction: column;
`;

const HomePage = (): JSX.Element => {
  return (
    <StyledHomePage>
      <Landing />
      <WhatIsSlide />
      <TokenSlide />
      <WhyUseSlide />
      <SupportedNetworks />
    </StyledHomePage>
  );
};

export default HomePage;
