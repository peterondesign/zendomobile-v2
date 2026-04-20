import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type BrandLogoProps = {
  width?: number;
  height?: number;
  mode?: 'light' | 'dark';
};

const logoGradients = {
  light: {
    softFrom: '#CCD0FE',
    softTo: '#6874FC',
    strongFrom: '#404BF2',
    strongTo: '#0C17B5',
  },
  dark: {
    softFrom: '#AAB5FF',
    softTo: '#7D8BFF',
    strongFrom: '#7683FF',
    strongTo: '#2436DA',
  },
} as const;

export function BrandLogo({
  width = 120,
  height = 83,
  mode = 'light',
}: BrandLogoProps) {
  const palette = logoGradients[mode];

  return (
    <Svg width={width} height={height} viewBox="0 0 120 83" fill="none">
      <Path
        fill="url(#paint0_linear)"
        fillRule="evenodd"
        d="M31.6079 7.59744C35.8493 13.7036 35.7774 21.923 31.3571 27.9615C37.3876 23.397 45.7161 23.2376 51.9106 27.518C47.6692 21.4118 47.7411 13.1924 52.1614 7.15389C46.1309 11.7184 37.8024 11.8778 31.6079 7.59744Z"
        clipRule="evenodd"
      />
      <Path
        fill="url(#paint1_linear)"
        fillRule="evenodd"
        d="M67.8928 54.701C72.1343 60.8071 72.0624 69.0266 67.6421 75.065C73.6725 70.5006 82.0011 70.3412 88.1956 74.6215C83.9541 68.5154 84.026 60.2959 88.4463 54.2574C82.4159 58.8219 74.0873 58.9813 67.8928 54.701Z"
        clipRule="evenodd"
      />
      <Path
        fill="url(#paint2_linear)"
        d="M17.5577 35.1156C27.2546 35.1156 35.1154 27.2547 35.1154 17.5578C35.1154 7.86099 27.2546 0.000128085 17.5577 0.000128085C7.86086 0.000128085 0 7.86099 0 17.5578C0 27.2547 7.86086 35.1156 17.5577 35.1156Z"
      />
      <Path
        fill="url(#paint3_linear)"
        fillRule="evenodd"
        d="M53.9415 47.1036C63.632 47.0816 71.5174 54.9311 71.5394 64.6216C71.5614 74.3121 63.7119 82.1975 54.0214 82.2195C44.3309 82.2414 36.4455 74.392 36.4235 64.7015C36.4015 55.011 44.251 47.1256 53.9415 47.1036Z"
        clipRule="evenodd"
      />
      <Path
        fill="url(#paint4_linear)"
        d="M65.875 35.1154C75.5719 35.1154 83.4327 27.2546 83.4327 17.5577C83.4327 7.86086 75.5719 0 65.875 0C56.1782 0 48.3173 7.86086 48.3173 17.5577C48.3173 27.2546 56.1782 35.1154 65.875 35.1154Z"
      />
      <Path
        fill="url(#paint5_linear)"
        fillRule="evenodd"
        d="M102.259 47.1036C111.95 47.0816 119.835 54.9311 119.857 64.6216C119.879 74.3121 112.03 82.1975 102.339 82.2195C92.6489 82.2414 84.7635 74.392 84.7415 64.7015C84.7195 55.011 92.569 47.1256 102.259 47.1036Z"
        clipRule="evenodd"
      />
      <Path
        fill="url(#paint6_linear)"
        fillRule="evenodd"
        d="M52.5884 28.8887C55.1597 35.8646 53.0248 43.8024 47.2295 48.5369C54.213 45.6342 62.3149 47.572 67.2354 53.2714C64.6641 46.2955 66.799 38.3576 72.5944 33.6232C65.6109 36.5259 57.509 34.5881 52.5884 28.8887Z"
        clipRule="evenodd"
      />
      <Defs>
        <LinearGradient id="paint0_linear" x1="452.479" y1="293.185" x2="83.9373" y2="-161.25" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.softFrom} />
          <Stop offset="1" stopColor={palette.softTo} />
        </LinearGradient>
        <LinearGradient id="paint1_linear" x1="243.434" y1="108.044" x2="-125.108" y2="-346.391" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.softFrom} />
          <Stop offset="1" stopColor={palette.softTo} />
        </LinearGradient>
        <LinearGradient id="paint2_linear" x1="-0.0011684" y1="41.1098" x2="317.372" y2="281.82" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.strongFrom} />
          <Stop offset="1" stopColor={palette.strongTo} />
        </LinearGradient>
        <LinearGradient id="paint3_linear" x1="-124.323" y1="-69.2712" x2="193.045" y2="171.435" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.strongFrom} />
          <Stop offset="1" stopColor={palette.strongTo} />
        </LinearGradient>
        <LinearGradient id="paint4_linear" x1="-164.922" y1="41.1098" x2="152.451" y2="281.82" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.strongFrom} />
          <Stop offset="1" stopColor={palette.strongTo} />
        </LinearGradient>
        <LinearGradient id="paint5_linear" x1="-289.242" y1="-69.0843" x2="28.1264" y2="171.622" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.strongFrom} />
          <Stop offset="1" stopColor={palette.strongTo} />
        </LinearGradient>
        <LinearGradient id="paint6_linear" x1="109.896" y1="81.2891" x2="15.8965" y2="1.79218" gradientUnits="userSpaceOnUse">
          <Stop stopColor={palette.softFrom} />
          <Stop offset="1" stopColor={palette.softTo} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}