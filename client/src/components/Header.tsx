import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import styled from "styled-components";
import Button from "./Button";
import Connector from "./Connector";

type NavItem = {
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    route: "",
  },
  {
    label: "Sent",
    route: "sent",
  },
  {
    label: "Received",
    route: "received",
  },
];

const StyledHeader = styled.div`
  width: 100%;
  height: 13rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6rem;

  @media (max-width: 600px) {
    padding: 0 2rem;
    height: auto;
    margin-top: 3rem;
    flex-direction: column;
  }
`;

const NavContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  z-index: 1;

  @media (max-width: 600px) {
    margin-bottom: 3rem;
  }
`;

const Header = (): JSX.Element => {
  const location = useLocation();
  const history = useHistory();

  const navItems = [...NAV_ITEMS];
  navItems.reverse();

  return (
    <StyledHeader>
      <NavContainer>
        {navItems.map((navItem: NavItem) => (
          <Button
            key={navItem.label}
            text={navItem.label}
            click={() => history.push(`/${navItem.route}`)}
            selected={location.pathname === `/${navItem.route}`}
          />
        ))}
      </NavContainer>
      <Connector />
    </StyledHeader>
  );
};

export default Header;
