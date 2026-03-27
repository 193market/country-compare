import React from 'react';
import { Composition } from 'remotion';
import { CountryVideo, VideoProps } from './CountryVideo';

export const Root: React.FC = () => {
  return (
    <Composition<VideoProps>
      id="CountryComparison"
      component={CountryVideo}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={60 * 30} // 60 seconds, overridden at render time
      defaultProps={{
        countryA: { name: 'Country A', slug: 'country-a', code: 'XX' },
        countryB: { name: 'Country B', slug: 'country-b', code: 'XX' },
        indicators: [],
        audioDurationInFrames: 60 * 30,
      }}
    />
  );
};
