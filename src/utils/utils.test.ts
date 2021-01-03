import { degreesToRadians } from './utils';

describe('degreesToRadians', function() {
  it('converts degress to radians', function() {
    expect(degreesToRadians(57)).toEqual(0.9948376736367678);
  });
});
