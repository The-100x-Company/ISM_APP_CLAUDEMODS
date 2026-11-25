"""Builds mods into deterministic zips and writes the one managed-settings JSON that installs them all.

Usage: python -I scripts/build.py <archive-url-base> <plugin-name>...
  e.g. python -I scripts/build.py https://github.com/The-100x-Company/ISM_APP_CLAUDEMODS/releases/download x100-solo-resultado

Each zip holds its plugin at the top level (.claude-plugin/, hooks/, types/), test files and the
engine-generated .claude-plugin/types/ left out, with fixed timestamps so the same sources always give
the same sha256. The JSON names every plugin given, under one inline marketplace: managed settings
hold one value per key, so a JSON per mod would overwrite each other.
"""

import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKETPLACE = 'ism-mods'
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def is_packed(path: Path, plugin_dir: Path) -> bool:
    parts = path.relative_to(plugin_dir).parts
    return '.test.' not in path.name and parts[:2] != ('.claude-plugin', 'types')


def build(name: str, url_base: str) -> dict:
    plugin_dir = ROOT / 'plugins' / name
    version = json.loads((plugin_dir / '.claude-plugin' / 'plugin.json').read_text(encoding='utf-8'))['version']
    tag = f'{name}-v{version}'
    zip_name = f'{name}-{version}.zip'
    zip_path = ROOT / 'dist' / zip_name
    zip_path.parent.mkdir(exist_ok=True)

    files = sorted(p for p in plugin_dir.rglob('*') if p.is_file() and is_packed(p, plugin_dir))
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            info = zipfile.ZipInfo(path.relative_to(plugin_dir).as_posix(), FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, path.read_bytes())

    sha256 = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    url = f'{url_base.rstrip("/")}/{tag}/{zip_name}'
    print(f'{name}: {zip_path.relative_to(ROOT).as_posix()} ({len(files)} files) sha256 {sha256} tag {tag}')

    return {'name': name, 'version': version, 'source': {'source': 'archive', 'url': url, 'sha256': sha256}}


def main(url_base: str, names: list[str]) -> None:
    plugins = [build(name, url_base) for name in names]
    settings = {
        'extraKnownMarketplaces': {
            MARKETPLACE: {
                'source': {'source': 'settings', 'name': MARKETPLACE, 'owner': {'name': 'The 100x Company'}, 'plugins': plugins},
            },
        },
        'enabledPlugins': {f'{plugin["name"]}@{MARKETPLACE}': True for plugin in plugins},
    }
    out = ROOT / 'deploy' / f'managed-settings.{MARKETPLACE}.json'
    out.write_text(json.dumps(settings, indent=2) + '\n', encoding='utf-8')
    print(f'json: {out.relative_to(ROOT).as_posix()}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
