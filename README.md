# Exploratory search prototype for [SLUB LOD-API](https://data.slub-dresden.de)

![webapp preview](./docs/images/explorative-Suche-preview.png)

This is a [Svelte](https://svelte.dev) app which enables exploring of [SLUB](https://www.slub-dresden.de)'s bibliographic data based on the topics connected to each bibliographic dataset. It is still a prototype so be gentle with it.

In order for the app to work, a running instance of the [LOD-API](https://github.com/slub/efre-lod-api) is needed, with the endpoint `/explore` enabled. This wrapper provides aggregated information to the webapp.

A hosted instance of the app connected to the [SLUB LOD-API](https://data.slub-dresden.de) can be found at [https://data.slub-dresden.de/explore](https://data.slub-dresden.de/explore).

## Get started

Install the dependencies...

```bash
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000/explore](http://localhost:5000/explore). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).

## Single-page app mode

By default, sirv will only respond to requests that match files in `public`. This is to maximise compatibility with static fileservers, allowing you to deploy your app anywhere.

If you're building a single-page app (SPA) with multiple routes, sirv needs to be able to respond to requests for _any_ path. You can make it so by editing the `"start"` command in package.json:

```js
"start": "sirv public --single"
```

<img alt="EFRE-Lod logo" src="https://raw.githubusercontent.com/slub/data.slub-dresden.de/master/assets/images/EFRE_EU_quer_2015_rgb_engl.svg" width="300">
