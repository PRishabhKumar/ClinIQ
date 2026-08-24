import React from "react";
import styled from "styled-components";

const Loader = ({ text }) => {
  return (
    <Container>
      <StyledWrapper>
        <div className="loader">
          <div className="loader-square" />
          <div className="loader-square" />
          <div className="loader-square" />
        </div>
      </StyledWrapper>
      {text && <p className="mt-4 text-emerald-700 font-medium animate-pulse">{text}</p>}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const StyledWrapper = styled.div`
  /* Container for loader */
  .loader {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    height: 60px;
  }

  /* Individual squares */
  .loader-square {
    width: 22px;
    height: 22px;
    background-color: #059669; /* Emerald 600 */
    border-radius: 4px;
    box-shadow: 0 0 12px rgba(5, 150, 105, 0.6); /* Emerald glow */
    animation: scaleBounce 1.2s infinite ease-in-out;
    position: relative;
  }

  /* Animations for each square */
  .loader-square:nth-child(1) {
    animation-delay: -0.4s;
  }
  .loader-square:nth-child(2) {
    animation-delay: -0.2s;
  }
  .loader-square:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes scaleBounce {
    0%,
    80%,
    100% {
      transform: scale(0.5);
      opacity: 0.6;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;

export default Loader;
