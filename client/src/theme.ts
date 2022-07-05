import { MantineThemeOverride } from '@mantine/core';
// import { gradientFromColor } from './utilities/color';

const defaultFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

const baseSat = '77%';
const baseLight = '63%';
const selectSat = '58%';
const selectLight = '58%';


export const graphColors = {
  // nodes
  resource: { base: `hsl(31, ${baseSat}, ${baseLight})`, selected: `hsl(31, ${selectSat}, ${selectLight})` },
  input: { base: `hsl(0, ${baseSat}, ${baseLight})`, selected: `hsl(0, ${selectSat}, ${selectLight})` },
  handGathered: { base: `hsl(261, ${baseSat}, ${baseLight})`, selected: `hsl(261, ${selectSat}, ${selectLight})` },
  sideProduct: { base: `hsl(311, ${baseSat}, ${baseLight})`, selected: `hsl(311, ${selectSat}, ${selectLight})` },
  finalProduct: { base: `hsl(128, ${baseSat}, ${baseLight})`, selected: `hsl(128, ${selectSat}, ${selectLight})` },
  recipe: { base: `hsl(197, ${baseSat}, ${baseLight})`, selected: `hsl(197, ${selectSat}, ${selectLight})` },
  nuclear: { base: `hsl(50, ${baseSat}, ${baseLight})`, selected: `hsl(50, ${selectSat}, ${selectLight})` },

  // edges
  edge: { line: '#999999', label: '#eeeeee' },
  incoming: { line: `hsl(31, ${baseSat}, ${baseLight})`, label: `hsl(31, ${baseSat}, ${baseLight})` },
  outgoing: { line: `hsl(128, ${baseSat}, ${baseLight})`, label: `hsl(128, ${baseSat}, ${baseLight})` },
}

export const theme: MantineThemeOverride = {
  primaryColor: 'primary',
  colors: {
    'primary': ["#fcebde", "#f9d8be", "#f7c59f", "#f4b17f", "#f19e60", "#ef8b40", "#ec7821", "#c4631c", "#94501e", "#673c1c"],
    'positive': ["#e9f3ea", "#d5e8d6", "#c1ddc2", "#acd2ae", "#98c69a", "#83bb86", "#6fb072", "#58965c", "#49744b", "#39543a"],
    'danger': ["#fdb5b5", "#fda3a3", "#fc9191", "#fc7e7e", "#fb6c6c", "#fa5959", "#fa4747", "#f12929", "#dc1818", "#b21b1b"],
    'background': ["#26282b", "#373b40", "#3f434a", "#50565e", "#6c7582", "#ffffff", "#ffffff", "#ffffff", "#b3b6ba", "#ffffff"],
    'info': Array(10).fill('#3065c7') as any,
  },
  white: '#eee',
  fontFamily: defaultFont,
  radius: { xs: 0, sm: 2, md: 4, lg: 8, xl: 16 },
  headings: {
    fontFamily: defaultFont,
    fontWeight: 700,
    sizes: {
      h1: { fontSize: 36, lineHeight: 1.3 },
      h2: { fontSize: 30, lineHeight: 1.35 },
      h3: { fontSize: 22, lineHeight: 1.4 },
      h4: { fontSize: 18, lineHeight: 1.45 },
      h5: { fontSize: 16, lineHeight: 1.5 },
      h6: { fontSize: 14, lineHeight: 1.5 },
    }
  },
  other: {
    headerHeight: '64px',
    pageLeftMargin: '55px',
    drawerWidth: '620px',
    drawerZIndex: '10',
    tooltipZIndex: '9999',
    scrollbarTrackColor: '#212226',
    scrollbarThumbColor: '#6c6c73',
  },
};


export const styles: any = {
  AppShell: (theme: any) => ({
    root: {
      minHeight: '100vh',
    }
  }),
  Paper: (theme: any) => ({
    root: {
      background: theme.colors.background[1],
      padding: '15px',
    }
  }),
  Text: (theme: any) => ({
    root: {
      color: theme.white,
    }
  }),
  Title: (theme: any) => ({
    root: {
      color: theme.white,
    }
  }),
  List: (theme: any) => ({
    item: {
      color: theme.white,
    }
  }),
  Anchor: (theme: any) => ({
    root: {
      color: theme.colors.primary[6],
    }
  }),
  Select: (theme: any) => ({
    label: {
      color: theme.white,
    },
    item: {
      borderRadius: '0px',
    },
    hovered: {
      background: theme.colors.background[8],
    },
    selected: {
      color: theme.white,
      background: theme.colors.primary[5],
    },
  }),
  TextInput: (theme: any) => ({
    label: {
      color: theme.white,
    }
  }),
  Checkbox: (theme: any) => ({
    label: {
      cursor: 'pointer',
      color: theme.white,
    },
    input: {
      cursor: 'pointer',
    }
  }),
  Switch: (theme: any) => ({
    label: {
      cursor: 'pointer',
      color: theme.white,
    },
    input: {
      cursor: 'pointer',
      background: theme.colors.background[1],
      borderWidth: '2px',
      '&:checked': {
        background: theme.colors.primary[6],
        borderColor: theme.colors.primary[6],
      }
    }
  }),
  Divider: (theme: any) => ({
    horizontal: {
      borderTopColor: theme.colors.background[3],
    }
  }),
  Button: (theme: any) => ({
    root: {
      color: '#fff',
      '&[disabled]': {
        color: `${theme.white} !important`,
        opacity: 0.5,
        '&:not(.mantine-Button-loading)': {
          backgroundColor: `${theme.colors.primary[6]} !important`,
        }
      }
    }
  }),
  Tabs: (theme: any) => ({
    tabLabel: {
      color: theme.white,
      fontFamily: "'M PLUS 1 Code', sans-serif",
      fontSize: '16px',
    },
    tabIcon: {
      color: theme.white,
    },
    tabActive: {
      background: `${theme.colors.background[1]} !important`,
      borderBottomWidth: `0px !important`,
    },
    body: {
      paddingTop: '0px',
      background: theme.colors.background[0],
      borderBottomLeftRadius: '2px',
      borderBottomRightRadius: '2px',
    },
  }),
  Tooltip: (theme: any) => ({
    body: {
      background: theme.colors.background[2],
      border: '1px solid #aaa',
    },
    arrow: {
      background: theme.colors.background[2],
      borderBottom: '1px solid #aaa',
      borderRight: '1px solid #aaa',
    }
  }),
  Popover: (theme: any) => ({
    body: {
      background: theme.colors.background[2],
      borderColor: '#aaa',
    },
    arrow: {
      background: theme.colors.background[2],
      borderColor: '#aaa',
    }
  }),
};
