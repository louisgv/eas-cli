import { fs } from 'memfs';

// needed because of a weird bug with tempy (dependency of @expo/config-plugins)
fs.mkdirSync('/tmp');
if (process.env.TMPDIR) {
  fs.mkdirSync(process.env.TMPDIR, { recursive: true });
}

// fs-extra@10 is not compatible with memfs, the following line fixes tests
(fs.realpath as any).native = jest.fn();

module.exports = fs;
