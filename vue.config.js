const path = require("path");
const resolve = dir => path.join(__dirname, dir);
const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
// const IS_PROD = true
const glob = require("glob");
const pagesInfo = require("./pages.config");
const pages = {};

glob.sync('./src/pages/**/main.js').forEach(entry => {
    let chunk = entry.match(/\.\/src\/pages\/(.*)\/main\.js/)[1];
    const curr = pagesInfo[chunk];
    if (curr) {
        pages[chunk] = {
            entry,
            ...curr,
            chunks: ["chunk-vendors", "chunk-common", chunk]
        }
    }
})

console.log(pages)
module.exports = {
    publicPath: IS_PROD ? process.env.VUE_APP_PUBLIC_PATH : "./", // 默认'/'，部署应用包时的基本 URL
    // outputDir: process.env.outputDir || 'dist', // 'dist', 生产环境构建文件的目录
    // assetsDir: "", // 相对于outputDir的静态资源(js、css、img、fonts)目录
    lintOnSave: false,
    runtimeCompiler: true, // 是否使用包含运行时编译器的 Vue 构建版本
    productionSourceMap: !IS_PROD, // 生产环境的 source map
    parallel: require("os").cpus().length > 1,
    pwa: {},
    pages,
    css: {
        extract: IS_PROD,
        sourceMap: false,
        loaderOptions: {
            scss: {
                // 向全局sass样式传入共享的全局变量, $src可以配置图片cdn前缀
                // 详情: https://cli.vuejs.org/guide/css.html#passing-options-to-pre-processor-loaders
                prependData: `
            @import "@scss/variables.scss";
            @import "@scss/mixins.scss";
            @import "@scss/function.scss";
            $src: "${process.env.VUE_APP_OSS_SRC}";
            `
            }
        }
    },
    configureWebpack: (config) => {

        if (IS_PROD) {
            config.externals = {
                vue: "Vue",
                "element-ui": "ELEMENT",
                "vue-router": "VueRouter",
                vuex: "Vuex",
                axios: "axios"
            };

            config.optimization = {
                splitChunks: {
                    cacheGroups: {
                        common: {
                            name: "chunk-common",
                            chunks: "initial",
                            minChunks: 2,
                            maxInitialRequests: 5,
                            minSize: 0,
                            priority: 1,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                        vendors: {
                            name: "chunk-vendors",
                            test: /[\\/]node_modules[\\/]/,
                            chunks: "initial",
                            priority: 2,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                        // elementUI: {
                        //     name: 'chunk-elementUI', // split elementUI into a single package
                        //     priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                        //     test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                        // },
                        elementUI: {
                            name: "chunk-elementui",
                            test: /[\\/]node_modules[\\/]element-ui[\\/]/,
                            chunks: "async",
                            priority: 3,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                        echarts: {
                            name: "chunk-echarts",
                            test: /[\\/]node_modules[\\/](vue-)?echarts[\\/]/,
                            chunks: "all",
                            priority: 4,
                            reuseExistingChunk: true,
                            enforce: true
                        }
                    }
                }
            };
        } else {
            config.externals = {
                'Vue': 'vue',
                'VueRouter': 'vue-router',
                'ELEMENT': 'element-ui',
                Vuex: "vuex",
                axios: "axios"
            };

        }

    },
    chainWebpack: (config) => {
        config.resolve.alias
            .set("vue$", "vue/dist/vue.esm.js")
            .set("@", resolve("src"))
            .set("@assets", resolve("src/assets"))
            .set("@scss", resolve("src/assets/scss"))
            .set("@components", resolve("src/components"))
            .set("@plugins", resolve("src/plugins"))
            .set("@views", resolve("src/views"))
            .set("@router", resolve("src/router"))
            .set("@store", resolve("src/store"))
            .set("@layouts", resolve("src/layouts"))
            .set("@static", resolve("src/static"));

        if (IS_PROD) {
            const cdn = {
                // 访问https://unpkg.com/element-ui/lib/theme-chalk/index.css获取最新版本
                css: ["//unpkg.com/element-ui@2.14.1/lib/theme-chalk/index.css"],
                js: [
                    "//unpkg.com/vue@2.6.11/dist/vue.min.js", // 访问https://unpkg.com/vue/dist/vue.min.js获取最新版本
                    "//unpkg.com/vue-router@3.2.0/dist/vue-router.min.js",
                    "//unpkg.com/vuex@3.4.0/dist/vuex.min.js",
                    "//unpkg.com/axios@0.21.1/dist/axios.min.js",
                    "//unpkg.com/element-ui@2.14.1/lib/index.js"
                ]
            };

            // config.plugin(`html`).tap(args => {
            //     // html中添加cdn
            //     args[0].cdn = cdn;

            //     // 修复 Lazy loading routes Error
            //     args[0].chunksSortMode = "none";
            //     return args;
            // });


            Object.keys(pagesInfo).forEach(page => {

                config.plugin(`html-${page}`).tap(args => {
                    // html中添加cdn
                    args[0].cdn = cdn;

                    // 修复 Lazy loading routes Error
                    args[0].chunksSortMode = "none";
                    return args;
                });


                // config.plugin(`preload-${page}`).tap(() => [{
                //     rel: 'preload',
                //     // to ignore runtime.js
                //     // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
                //     fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
                //     // include: 'initial'
                //     include: []
                // }])
                // config.plugins.delete(`prefetch-${page}`);
                // config.plugins.delete(`preload-${page}`)
            });
            //     // config.optimization.delete("splitChunks");
            //     // config.optimization.runtimeChunk('single')
        }
    }
}