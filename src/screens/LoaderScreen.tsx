import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;

const { height: H, width: W } = Dimensions.get('window');
const IS_SMALL = H < 750;
const IS_TINY = H < 690;
const IS_VERY_TINY = H < 640;

const BG = require('../assets/background.png');
const LOGO = require('../assets/logo.png');

type Phase = 'web' | 'logo';

function buildLoaderHtml() {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: transparent !important;
      overflow: hidden;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loader {
      display: flex;
      width: 8rem;
      height: 8rem;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .head {
      width: 100%;
      height: 100%;
      background-color: #e5f295;
      border-radius: 50%;
      animation: move 3s linear infinite;
      box-shadow: 0 1rem 1rem #5beebd;
      filter: blur(0.3rem);
      z-index: 1;
    }

    .eye {
      display: flex;
      position: absolute;
      width: 4rem;
      height: 4rem;
      background-color: #efffc8;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      z-index: 2;
      box-shadow: 0 0 1rem #000000;
      animation: move 5s alternate infinite;
    }

    .eye::before {
      content: "";
      display: flex;
      width: 1rem;
      height: 2rem;
      background-color: #000;
      border-radius: 50%;
      animation: blink 4s ease-in-out alternate infinite;
    }

    .flames {
      display: flex;
      position: absolute;
      z-index: 0;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .particle {
      position: absolute;
      background-color: #e5f295;
      border-radius: 50%;
      filter: blur(0.3rem);
      border-top: 5px solid #e5f295;
      border-left: 5px solid #e5f295;
    }

    .flames::before {
      content: "";
      position: absolute;
      width: 8rem;
      height: 8rem;
      background: #e5f295;
      filter: blur(5rem);
      opacity: 0.5;
      border-radius: 50%;
      top: -8rem;
      left: -4rem;
      z-index: 4;
      animation: pulse 3s linear infinite;
    }

    .particle:nth-child(1) { width: 4rem; height: 4rem; top: -6rem; animation: move 7s alternate-reverse infinite; }
    .particle:nth-child(2) { width: 1.5rem; height: 1.5rem; top: -8rem; left: -5rem; animation: move 1.5s ease-in-out reverse infinite; }
    .particle:nth-child(3) { width: 4rem; height: 4rem; top: -5rem; left: -4rem; animation: move 8s alternate-reverse infinite; }
    .particle:nth-child(4) { width: 3rem; height: 3rem; top: -7.5rem; animation: move 4s alternate-reverse infinite; }
    .particle:nth-child(5) { width: 2rem; height: 2rem; top: -9rem; left: 1rem; animation: move 2.5s alternate-reverse infinite; }
    .particle:nth-child(6) { width: 2rem; height: 2rem; top: -6.8rem; left: -1.5rem; animation: move 5s alternate-reverse infinite; }
    .particle:nth-child(7) { width: 1rem; height: 1rem; top: -10rem; left: -1rem; animation: move 1.2s alternate-reverse infinite; }
    .particle:nth-child(8) { width: 1.3rem; height: 1.3rem; top: -7.5rem; left: -2rem; animation: move 2.5s alternate-reverse infinite; }

    @keyframes move { 0% { transform: translate(0,0);} 50% { transform: translate(4px,6px);} 100% { transform: translate(0,0);} }
    @keyframes blink {
      20% { transform: translate(0, 0); height: 2rem; }
      30% { height: 0; }
      40% { transform: translate(5px, 10px); height: 0; }
      50% { height: 2rem; }
      70% { transform: translate(-10px, -10px); }
      90% { transform: translate(0, 0); }
    }
    @keyframes pulse { 0% {opacity: .5;} 50% {opacity: 1;} 100% {opacity: .5;} }
  </style>
</head>
<body>
  <div class="loader">
    <div class="flames">
      <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>
      <span class="particle"></span><span class="particle"></span><span class="particle"></span><span class="particle"></span>
    </div>
    <div class="head"></div>
    <div class="eye"></div>
  </div>
</body>
</html>
`;
}

export default function LoaderScreen({ navigation }: Props) {
  const [phase, setPhase] = useState<Phase>('web');
  const html = useMemo(() => buildLoaderHtml(), []);

  useEffect(() => {
    let alive = true;

    const t1 = setTimeout(() => {
      if (!alive) return;
      setPhase('logo');
    }, 3000);

    const t2 = setTimeout(() => {
      if (!alive) return;
      navigation.replace('Onboarding');
    }, 6000);

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [navigation]);
  const LOADER_SIZE = Math.min(
    IS_VERY_TINY ? 165 : IS_TINY ? 185 : IS_SMALL ? 205 : 220,
    Math.floor(W * 0.7)
  );

  const LOGO_SIZE = Math.min(
    IS_VERY_TINY ? 200 : IS_TINY ? 220 : IS_SMALL ? 232 : 240,
    Math.floor(W * 0.78)
  );

  const injected = `
    (function () {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      true;
    })();
  `;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.center}>
        {phase === 'web' ? (
          <WebView
            originWhitelist={['*']}
            source={{ html }}
            injectedJavaScript={injected}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            setSupportMultipleWindows={false}

            opaque={false}
            style={[styles.web, { width: LOADER_SIZE, height: LOADER_SIZE }]}
            containerStyle={styles.webContainer}

            androidLayerType="software"
          />
        ) : (
          <Image source={LOGO} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} resizeMode="contain" />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  webContainer: {
    backgroundColor: 'transparent',
  },

  web: {
    backgroundColor: 'transparent',
  },
});
