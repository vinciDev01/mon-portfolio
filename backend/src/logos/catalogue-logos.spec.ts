import { avecTrace, cle, correspondance, logoDe, rechercherLogos, traceDe } from './catalogue-logos';

describe('catalogue des logos', () => {
  it('normalise les noms comme les identifiants du catalogue', () => {
    expect(cle('Next.js')).toBe('nextjs');
    expect(cle('C++')).toBe('cplusplus');
    expect(cle('C#')).toBe('csharp');
    expect(cle(' Tailwind CSS ')).toBe('tailwindcss');
  });

  it('associe les technologies courantes, alias compris', () => {
    expect(correspondance('Java')).toBe('openjdk');
    expect(correspondance('HTML')).toBe('html5');
    expect(correspondance('Spring Boot')).toBe('springboot');
    expect(correspondance('Next.js')).toBe('nextdotjs');
    expect(correspondance('Node.js')).toBe('nodedotjs');
    expect(correspondance('PostgreSQL')).toBe('postgresql');
    expect(correspondance('Tailwind CSS')).toBe('tailwindcss');
  });

  it('ne retient jamais une correspondance douteuse', () => {
    expect(correspondance('Management')).toBeNull();
    expect(correspondance('')).toBeNull();
  });

  it('cherche par debut de nom, le plus proche en tete, avec le trace', () => {
    const r = rechercherLogos('reac');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].slug).toBe('react');
    expect(r[0].trace).toMatch(/^[Mm]/);
    expect(rechercherLogos('java')[0]).toMatchObject({ slug: 'openjdk', exact: true });
    expect(rechercherLogos('reac')[0].exact).toBe(false);
    expect(rechercherLogos('zzzzqq')).toEqual([]);
    expect(rechercherLogos('a', 5).length).toBeLessThanOrEqual(5);
  });

  it('lit le trace d un logo, et refuse un identifiant suspect', () => {
    expect(traceDe('docker')).toMatch(/^[Mm]/);
    expect(traceDe('../../etc/passwd')).toBeNull();
    expect(traceDe('inexistant123')).toBeNull();
    expect(traceDe(null)).toBeNull();
    expect(logoDe('react')?.title).toBe('React');
  });

  it('ajoute le trace a une technologie', () => {
    const git = avecTrace({ label: 'Git', logoSlug: 'git' });
    expect(git.logoTrace).toMatch(/^[Mm]/);
    expect(git.logoHex).toMatch(/^[0-9A-F]{6}$/i);
    expect(avecTrace({ label: 'X', logoSlug: null })).toMatchObject({ logoTrace: null, logoHex: null });
  });
});
