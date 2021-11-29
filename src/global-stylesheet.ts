import { createGlobalStyle } from "styled-components";
import bgImage from './assets/stripe-bg.png';

const GlobalStylesheet = createGlobalStyle<any>`
  body {
    margin: 0;
    padding: 0;
    font-family: ${({ theme }) => theme.fontFamily};
    background: url(${bgImage});
  }

  #root {
    min-height: 100vh;
  }

  * {
    scrollbar-color: ${({ theme }) => `${theme.other.scrollbarThumbColor} ${theme.other.scrollbarTrackColor}`};

    ::-webkit-scrollbar {
      width: auto;
    }

    ::-webkit-scrollbar-track {
      background-color: ${({ theme }) => theme.other.scrollbarTrackColor};
    }

    ::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.other.scrollbarThumbColor};
    }

    ::-webkit-scrollbar-corner {
      background-color: ${({ theme }) => theme.other.scrollbarTrackColor};
    }
    
    ::-webkit-scrollbar-button:single-button {
      background-color: ${({ theme }) => theme.other.scrollbarTrackColor};
      display: block;
      height: auto;
      width: auto;
      background-size: 10px;
      background-repeat: no-repeat;
      background-position: center center;
    }

    // Up
    ::-webkit-scrollbar-button:single-button:vertical:decrement {
      background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#eee"><polygon points="50,20 100,75 0,75 Z"/></svg>')}");
    }

    // Down
    ::-webkit-scrollbar-button:single-button:vertical:increment {
      background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#eee"><polygon points="50,75 100,20 0,20 Z"/></svg>')}");
    }

    // Left
    ::-webkit-scrollbar-button:single-button:horizontal:decrement {
      background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#eee"><polygon points="20,50 75,100 75,0 Z"/></svg>')}");
    }

    // Right
    ::-webkit-scrollbar-button:single-button:horizontal:increment {
      background-image: url("data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="#eee"><polygon points="75,50 20,100 20,0 Z"/></svg>')}");
    }
  }
`;

export default GlobalStylesheet;
