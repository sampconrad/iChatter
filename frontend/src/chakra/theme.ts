import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme(
  { config },
  {
    colors: {
      brand: {
        50: '#cbd6dd',
        100: '#3281db',
        200: '#3172bb',
        500: '#718096',
        800: '#20242b',
        900: '#171923',
      },
    },
    styles: {
      global: () => ({
        body: {
          bg: '#20242b',
          color: '#fff',
        },
      }),
    },
  }
);

export default theme;
