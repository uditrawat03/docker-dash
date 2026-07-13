export const releaseChecklist = [
    {
        id: 'metadata',
        title: 'App metadata',
        detail: 'Name, author, version, icon, and repository links are ready for packaging.',
        status: 'ready',
    },
    {
        id: 'smoke-test',
        title: 'Local smoke test',
        detail: 'Docker status, containers, images, volumes, networks, Compose, and settings open without runtime errors.',
        status: 'review',
    },
    {
        id: 'signing',
        title: 'Code signing',
        detail: 'Windows certificate, macOS Developer ID, and Linux signing/checksum plan are prepared.',
        status: 'blocked',
    },
    {
        id: 'release-notes',
        title: 'Release notes',
        detail: 'User-facing changes, known limitations, and upgrade notes are written before publishing.',
        status: 'review',
    },
    {
        id: 'checksums',
        title: 'Checksums',
        detail: 'Installer hashes are generated and attached beside release artifacts.',
        status: 'blocked',
    },
];

export const releaseTargets = [
    {id: 'windows', label: 'Windows', artifact: '.exe or installer', signing: 'Authenticode'},
    {id: 'macos', label: 'macOS', artifact: '.app or .dmg', signing: 'Developer ID + notarization'},
    {id: 'linux', label: 'Linux', artifact: 'AppImage, deb, or rpm', signing: 'Checksum or package signing'},
];
