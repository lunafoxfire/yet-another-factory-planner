import { MantineThemeOverride } from '@mantine/core';
import { gradientFromColor } from './utilities/color';

export const theme: MantineThemeOverride = {
  colorScheme: 'dark',
  primaryColor: 'primary',
  colors: {
    'primary': gradientFromColor('#ffbd4a') as any,
    'danger': gradientFromColor('#fa5252') as any,
  },
  radius: {
    xs: 0,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  other: {
    headerHeight: '70px',
    drawerOpenWidth: '600px',
    drawerClosedWidth: '40px',
  },
};


// ======== DEFAULT THEME FOR REFERENCE ======== //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultTheme: any = {
  "loader": "oval",
  "dateFormat": "MMMM D, YYYY",
  "colorScheme": "light",
  "white": "#fff",
  "black": "#000",
  "transitionTimingFunction": "cubic-bezier(.51,.3,0,1.21)",
  "colors": {
    "dark": ["#C1C2C5", "#A6A7AB", "#909296", "#5c5f66", "#373A40", "#2C2E33", "#25262b", "#1A1B1E", "#141517", "#101113"],
    "gray": ["#f8f9fa", "#f1f3f5", "#e9ecef", "#dee2e6", "#ced4da", "#adb5bd", "#868e96", "#495057", "#343a40", "#212529"],
    "red": ["#fff5f5", "#ffe3e3", "#ffc9c9", "#ffa8a8", "#ff8787", "#ff6b6b", "#fa5252", "#f03e3e", "#e03131", "#c92a2a"],
    "pink": ["#fff0f6", "#ffdeeb", "#fcc2d7", "#faa2c1", "#f783ac", "#f06595", "#e64980", "#d6336c", "#c2255c", "#a61e4d"],
    "grape": ["#f8f0fc", "#f3d9fa", "#eebefa", "#e599f7", "#da77f2", "#cc5de8", "#be4bdb", "#ae3ec9", "#9c36b5", "#862e9c"],
    "violet": ["#f3f0ff", "#e5dbff", "#d0bfff", "#b197fc", "#9775fa", "#845ef7", "#7950f2", "#7048e8", "#6741d9", "#5f3dc4"],
    "indigo": ["#edf2ff", "#dbe4ff", "#bac8ff", "#91a7ff", "#748ffc", "#5c7cfa", "#4c6ef5", "#4263eb", "#3b5bdb", "#364fc7"],
    "blue": ["#e7f5ff", "#d0ebff", "#a5d8ff", "#74c0fc", "#4dabf7", "#339af0", "#228be6", "#1c7ed6", "#1971c2", "#1864ab"],
    "cyan": ["#e3fafc", "#c5f6fa", "#99e9f2", "#66d9e8", "#3bc9db", "#22b8cf", "#15aabf", "#1098ad", "#0c8599", "#0b7285"],
    "teal": ["#e6fcf5", "#c3fae8", "#96f2d7", "#63e6be", "#38d9a9", "#20c997", "#12b886", "#0ca678", "#099268", "#087f5b"],
    "green": ["#ebfbee", "#d3f9d8", "#b2f2bb", "#8ce99a", "#69db7c", "#51cf66", "#40c057", "#37b24d", "#2f9e44", "#2b8a3e"],
    "lime": ["#f4fce3", "#e9fac8", "#d8f5a2", "#c0eb75", "#a9e34b", "#94d82d", "#82c91e", "#74b816", "#66a80f", "#5c940d"],
    "yellow": ["#fff9db", "#fff3bf", "#ffec99", "#ffe066", "#ffd43b", "#fcc419", "#fab005", "#f59f00", "#f08c00", "#e67700"],
    "orange": ["#fff4e6", "#ffe8cc", "#ffd8a8", "#ffc078", "#ffa94d", "#ff922b", "#fd7e14", "#f76707", "#e8590c", "#d9480f"]
  },
  "lineHeight": 1.55,
  "fontFamily": "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
  "fontFamilyMonospace": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
  "primaryColor": "blue",
  "shadows": {
    "xs": "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
    "sm": "0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px",
    "md": "0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px",
    "lg": "0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 28px 23px -7px, rgba(0, 0, 0, 0.04) 0px 12px 12px -7px",
    "xl": "0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 36px 28px -7px, rgba(0, 0, 0, 0.04) 0px 17px 17px -7px"
  },
  "fontSizes": { "xs": 12, "sm": 14, "md": 16, "lg": 18, "xl": 20 },
  "radius": { "xs": 2, "sm": 4, "md": 8, "lg": 16, "xl": 32 },
  "spacing": { "xs": 10, "sm": 12, "md": 16, "lg": 20, "xl": 24 },
  "breakpoints": { "xs": 576, "sm": 768, "md": 992, "lg": 1200, "xl": 1400 },
  "headings": {
    "fontFamily": "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
    "fontWeight": 700,
    "sizes": {
      "h1": { "fontSize": 34, "lineHeight": 1.3 },
      "h2": { "fontSize": 26, "lineHeight": 1.35 },
      "h3": { "fontSize": 22, "lineHeight": 1.4 },
      "h4": { "fontSize": 18, "lineHeight": 1.45 },
      "h5": { "fontSize": 16, "lineHeight": 1.5 },
      "h6": { "fontSize": 14, "lineHeight": 1.5 }
    }
  },
  "other": {},
  "fn": {}
}
