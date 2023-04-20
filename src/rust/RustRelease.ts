import { Component, Project, TextFile, TomlFile } from 'projen';

export interface RustReleaseProps {
  githubRepo: {owner: string; repository: string};
}
export class RustRelease extends Component {

  constructor(project: Project, props: RustReleaseProps) {
    super(project);

    new TextFile(project, 'scripts/release.sh', {
      executable: true,
      lines: [
        '#!/usr/bin/env bash',
        'set -ex',
        '',
        'if [ -n "$1" ]; then',
        '    yarn install --frozen-lockfile',
        '    # update the version',
        '    yarn version --no-git-tag-version --$1',
        '    yarn projen',
        '    # will update Cargo.lock',
        '    cargo check',
        '',
        '    version=$(npm pkg get version | sed -e "s/\\"//g")',
        '    git add -A && git commit -m "chore(release): release v$version"',
        '    # generate a changelog for the tag message',
        '    git tag v$version',
        'else',
        '    echo "warn: please provide a version bump (patch/minor/major)"',
        '    exit 1',
        'fi',
      ],
    });
    new TomlFile(project, 'cliff.toml', {
      obj: {
        changelog: {
          header: ['# Changelog', 'All notable changes to this project will be documented in this file.', '\n'].join('\n'),
          body: [
            '{% if version %}',
            '## [{{ version | trim_start_matches(pat="v") }}] - {{ timestamp | date(format="%Y-%m-%d") }}',
            '{% else %}',
            '## [unreleased]',
            '{% endif %}',
            '\n',
            ['{% for group, commits in commits | group_by(attribute="group") %}',
              '    ### {{ group | upper_first }}',
              '    {% for commit in commits %}',
              '        - {% if commit.breaking %}[**breaking**] {% endif %}{{ commit.message | upper_first }}',
              '    {% endfor %}',
              '{% endfor %}'].join('\n'),
          ].join(''),
          trim: true,
          footer: '<!-- generated by git-cliff -->\n',
        },
        git: {
          conventional_commits: true,
          filter_unconventional: false,
          commit_preprocessors: [
            {
              pattern: '\\((\\w+\\s)?#([0-9]+)\\)',
              replace: `([#$\{2}](https://github.com/${props.githubRepo.owner}/${props.githubRepo.repository}/issues/$\{2}))`,
            },
          ],
          commit_parsers: [
            { message: '^feat', group: 'Features' },
            { message: '^fix', group: 'Bug Fixes' },
            { message: '^doc', group: 'Documentation' },
            { message: '^perf', group: 'Performance' },
            { message: '^refactor', group: 'Refactor' },
            { message: '^style', group: 'Styling' },
            { message: '^chore\\(release\\):', skip: true },
            { message: '^chore', group: 'Miscellaneous Tasks' },
            { message: '.*security', group: 'Security' },
            { message: "^'?Release", skip: true },
            { message: '^Update changelog', skip: true },
            { message: '.*', group: 'Miscellaneous Tasks' },
          ],
          filter_commits: false,
          tag_pattern: 'v[0-9]*',
          skip_tags: 'v0.1.0-beta.1',
          ignore_tags: '',
          topo_order: false,
          sort_commits: 'oldest',
        },
      },
    });
  }
}
