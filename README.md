ts-client
=================

A TypeScript CLI for interacting with Regolo.ai's LLM-based API and Model Management platform


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ts-client.svg)](https://npmjs.org/package/ts-client)
[![Downloads/week](https://img.shields.io/npm/dw/ts-client.svg)](https://npmjs.org/package/ts-client)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g ts-client
$ ts-client COMMAND
running command...
$ ts-client (--version)
ts-client/0.0.0 linux-x64 node-v25.2.1
$ ts-client --help [COMMAND]
USAGE
  $ ts-client COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ts-client hello PERSON`](#ts-client-hello-person)
* [`ts-client hello world`](#ts-client-hello-world)
* [`ts-client help [COMMAND]`](#ts-client-help-command)
* [`ts-client plugins`](#ts-client-plugins)
* [`ts-client plugins add PLUGIN`](#ts-client-plugins-add-plugin)
* [`ts-client plugins:inspect PLUGIN...`](#ts-client-pluginsinspect-plugin)
* [`ts-client plugins install PLUGIN`](#ts-client-plugins-install-plugin)
* [`ts-client plugins link PATH`](#ts-client-plugins-link-path)
* [`ts-client plugins remove [PLUGIN]`](#ts-client-plugins-remove-plugin)
* [`ts-client plugins reset`](#ts-client-plugins-reset)
* [`ts-client plugins uninstall [PLUGIN]`](#ts-client-plugins-uninstall-plugin)
* [`ts-client plugins unlink [PLUGIN]`](#ts-client-plugins-unlink-plugin)
* [`ts-client plugins update`](#ts-client-plugins-update)

## `ts-client hello PERSON`

Say hello

```
USAGE
  $ ts-client hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ ts-client hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/matteo-brandolino/ts-client/blob/v0.0.0/src/commands/hello/index.ts)_

## `ts-client hello world`

Say hello world

```
USAGE
  $ ts-client hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ ts-client hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/matteo-brandolino/ts-client/blob/v0.0.0/src/commands/hello/world.ts)_

## `ts-client help [COMMAND]`

Display help for ts-client.

```
USAGE
  $ ts-client help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for ts-client.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.37/src/commands/help.ts)_

## `ts-client plugins`

List installed plugins.

```
USAGE
  $ ts-client plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ ts-client plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/index.ts)_

## `ts-client plugins add PLUGIN`

Installs a plugin into ts-client.

```
USAGE
  $ ts-client plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into ts-client.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TS_CLIENT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TS_CLIENT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ ts-client plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ ts-client plugins add myplugin

  Install a plugin from a github url.

    $ ts-client plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ ts-client plugins add someuser/someplugin
```

## `ts-client plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ ts-client plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ ts-client plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/inspect.ts)_

## `ts-client plugins install PLUGIN`

Installs a plugin into ts-client.

```
USAGE
  $ ts-client plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into ts-client.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the TS_CLIENT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the TS_CLIENT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ ts-client plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ ts-client plugins install myplugin

  Install a plugin from a github url.

    $ ts-client plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ ts-client plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/install.ts)_

## `ts-client plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ ts-client plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ ts-client plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/link.ts)_

## `ts-client plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ ts-client plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ts-client plugins unlink
  $ ts-client plugins remove

EXAMPLES
  $ ts-client plugins remove myplugin
```

## `ts-client plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ ts-client plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/reset.ts)_

## `ts-client plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ ts-client plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ts-client plugins unlink
  $ ts-client plugins remove

EXAMPLES
  $ ts-client plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/uninstall.ts)_

## `ts-client plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ ts-client plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ ts-client plugins unlink
  $ ts-client plugins remove

EXAMPLES
  $ ts-client plugins unlink myplugin
```

## `ts-client plugins update`

Update installed plugins.

```
USAGE
  $ ts-client plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.56/src/commands/plugins/update.ts)_
<!-- commandsstop -->
