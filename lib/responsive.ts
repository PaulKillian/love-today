import { useWindowDimensions } from "react-native";

export function useBreakpoints() {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 900;
  const isDesktop = width >= 900;
  const cols = width >= 1100 ? 3 : width >= 700 ? 2 : 1; // cards per row

  return {
    width, isMobile, isTablet, isDesktop, cols,
    // scale a few tokens
    containerPad: isDesktop ? 28 : isTablet ? 22 : 16,
    gap: isDesktop ? 16 : 10,
    radius: isDesktop ? 24 : 18,
    titleSize: isDesktop ? 28 : 22,
    bodySize: isDesktop ? 18 : 16,
  };
}
