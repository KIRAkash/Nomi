import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// Fewer tabs at once: under load Chrome sometimes painted a frame with tiles garbled.
Config.setConcurrency(4);
// Remotion's bundled headless browser crashes on this Mac; the installed Chrome works.
Config.setBrowserExecutable('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
