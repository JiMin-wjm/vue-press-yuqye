/**
 * Module dependencies.
 */

const assert = require('assert')
const { chalk, parseFrontmatter, path } = require('@vuepress/shared-utils')
const Yuque = require('./yuque')
const { getSidebarByToc } = require('./toc')
const spinner = require('./spinner')
const { prettify } = require('./html')
const { PACKAGE_NAME } = require('./constant')
const debug = require('debug')(PACKAGE_NAME)

/**
 * Expose vuepress-plugin-yuque
 */

module.exports = (opts, ctx) => {
  return {
    name: PACKAGE_NAME,

    enhanceAppFiles: [
      path.join(__dirname, 'client.js')
    ],

    plugins: [
      ['@vuepress/medium-zoom', true],
    ],

    chainMarkdown(config) {
      if (opts.html) {
        return
      }
      // Disable `html` for now. Many yuque writers would write raw HTML in the markdown
      // But only these markups under inline code(`) will be transpiled successfully when
      // `html` is enabled.
      config
        .options
        .html(false)
    },

    async ready() {
      let { repoId, repoUrl, authToken, source } = opts

      if (repoId) {
        assert(
          typeof repoId === 'string' ||
          typeof repoId === 'number',
          `[${PACKAGE_NAME}] repoId should be string or number, but got ${repoId}`
        )
      } else if (repoUrl) {
        assert(
          typeof repoUrl === 'string',
          `[${PACKAGE_NAME}] repoUrl should be string, but got ${repoId}`
        )
      } else {
        throw new Error(`Expected repoId or repoUrl`)
      }

      Yuque.setAuthToken(authToken)

      if (repoUrl) {
        const targetRepo = await Yuque.inferRepoByUrl(repoUrl)
        repoId = targetRepo.id
      }

      Yuque.setRepoId(repoId)
      const yuque = Yuque.getInstance()

      spinner.start(`Fetching repo detail ...`)
      const repoDetail = await yuque.getRepoDetail()
      if (!(repoDetail && repoDetail.data && repoDetail.data.name)) {
        spinner.fail(
          `Please check your repoId: ${chalk.yellow(repoId)} ` +
          `response: ${JSON.stringify(repoDetail)}`
        )
        process.exit(1)
      }
      spinner.succeed(`Retrieved repo detail`)

      const { name, description, user } = repoDetail.data
      spinner.succeed(
        `Your Yuque website: ${chalk.green(name)} ` +
        `${chalk.gray(description)} ...`
      )
      spinner.start(`Fetching TOC ... `)

      const toc = await yuque.getToc()
      assert(
        toc && toc.data,
        `[${PACKAGE_NAME}] cannot get toc of ${repoId}`
      )

      debug('toc', toc.data)

      spinner.succeed(`Retrieved TOC`)

      // Apply sidebar config
      const sidebar = getSidebarByToc(toc.data)
      ctx.siteConfig.themeConfig = ctx.siteConfig.themeConfig || {}
      ctx.siteConfig.themeConfig.sidebar = sidebar
      if (!ctx.siteConfig.title) {
        ctx.siteConfig.title = name
      }
      if (!ctx.siteConfig.description) {
        ctx.siteConfig.description = description
      }

      let defaultActionLink

      // Apply pages
      for (const page of toc.data) {
        const { title, slug } = page
        // Once the slug is equal to '#', it means that current node
        // is an empty node.
        if (!slug || slug === '#') {
          continue
        }

        spinner.start(`Fetching ${chalk.cyan(title)} ... `)

        const { status, data } = await yuque.getPage(slug)
        debug('status = ', status)

        let postContent
        if (status && status === 404) {
          postContent = `# ${title}\n > 此文档尚未创建`
        } else {
          const useMarkdown = typeof source === 'string'
            ? source === 'markdown'
            : typeof source === 'function'
              ? source(page) === 'markdown'
              : false
          if (useMarkdown || data.format === 'markdown') {
            postContent = data.body || ''
          } else {
            postContent = prettify(data.body_html || '')
          }
        }

        const {
          data: frontmatter,
          content: strippedContent
        } = parseFrontmatter(postContent)
        const inferredTitle = inferTitle({}, strippedContent)

        let content = inferredTitle
          ? postContent
          : `# ${title} \n\n ${postContent}`

        if (opts.yuqueLink) {
          content += opts.yuqueLinkHtml || ``
        }

        const permalink = `/${slug}.html`

        await ctx.addPage({
          content,
          frontmatter,
          permalink
        })

        if (!defaultActionLink) {
          defaultActionLink = permalink
        }

        spinner.succeed(`Retrieved ${chalk.cyan(title)} ... `)
      }

      if (ctx.pages.every(page => page.path !== '/')) {
        const { home = {} } = opts
        const { actionText, actionLink, heroImage, features, footer } = home

        spinner.info(`Apply default homepage`)
        await ctx.addPage({
          content: '',
          permalink: '/',
          frontmatter: {
            home: true,
            heroImage: heroImage || user.large_avatar_url,
            actionText: actionText || '开始接入',
            actionLink: actionLink || defaultActionLink,
            features: features || undefined,
            footer: footer || `Copyright © ${user.name}`,
          }
        })
      }
    }
  }
}

/**
 * Infer title, forked from VuePress.
 */
function inferTitle(frontmatter, strippedContent) {
  if (frontmatter.home) {
    return 'Home';
  }
  if (frontmatter.title) {
    return frontmatter.title
  }
  const match = strippedContent.trim().match(/^#\s+(.*)/);
  if (match) {
    return match[1];
  }
};
