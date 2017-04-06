var path = require('path');
var webpack = require('webpack');
var forEach = require('lodash/forEach');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var pages = [
	'404',
	'blog',
	'blog-detail',
	'contact',
	'detail',
	'detail-2',
	'index',
	'downloads',
	'submit',
	'account',
	'macrotrader',
	'faq',
	'login',
	'register',
	'reset-password',
	'fx-bolt',
	'newstrading',
	'calendar',
	'terms-and-conditions',
	'how-it-works',
	'products'
];

var isProd = process.env.NODE_ENV === 'production' ? true : false;

var outputPath = path.join(__dirname, 'dist');

var uglifyOption = {
	mangle: true,
	output: {
		comments: false
	},
	compress: {
		dead_code: true,
		drop_debugger: true,
		unsafe: false,
		conditionals: true,
		comparisons: true,
		evaluate: true,
		booleans: true,
		loops: true,
		unused: true,
		hoist_funs: true,
		hoist_vars: true,
		if_return: true,
		join_vars: true,
		cascade: true,
		side_effects: true,
		warnings: false
	}
};
var extractSCSS = new ExtractTextPlugin({
	filename: 'css/[name].css',
	disable: false,
	allChunks: true
});



function jadePage(name) {
	return new HtmlWebpackPlugin({
		filename: name + '.html',
		mobile: true,
		title: 'uPages',
		lang: 'en',
		favicon: false,
		template: '!!pug!./src/' + name + '.pug',
		inject: false,
		homePage: "http://localhost:3000",
		injectExtras: {
			head: [
				"https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
				{
					tag: 'link',
					href: 'https://fonts.googleapis.com/css?family=Open+Sans:300,400',
					rel: "stylesheet",
					type: "text/css"
				}
			],
			body: [
				{
					tag: "script",
					src: "http://maps.google.com/maps/api/js?key=AIzaSyBEDfNcQRmKQEyulDN8nGWjLYPm8s4YB58&libraries=places"
				},
				{
					tag: "script",
					src: "https://www.gstatic.com/charts/loader.js"
				},
				"https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js",
				{
					tag: "script",
					innerHTML: "var wpApiSettings = {'root':'http://dev.upages.com.ua/wp-json/','nonce':'a530fa0ec6','versionString':'wp/v2'};"
				},
				{
					tag: "noscript",
					innerHTML: "JavaScript is disabled in your browser. <a href='http://www.enable-javascript.com/' target='_blank'>Here</a> is how to enable it."
				}
			]
		}
	})
}

function getPlugins() {
	var plugins = [];
	
	plugins.push(
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
			}
		}),
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery",
			"window.jQuery": "jquery"
		}),
		extractSCSS
	);
	
	forEach(pages, function (e) {
		plugins.push(jadePage(e))
	});
	
	if (isProd) {
		plugins.push(
			new webpack.optimize.UglifyJsPlugin(uglifyOption)
		);
	}
	
	return plugins;
}

module.exports = {
	context: path.join(__dirname, 'src'),
	entry: {
		vendor: [
			'expose?window.bsn!bootstrap.native'
		],
		index: [
			'./assets/js',
			'./assets/scss'
		]
	},
	output: {
		filename: 'js/[name].js',
		chunkFilename: "js/[id]-[name].chunk.js",
		path: outputPath,
		publicPath: '/assets/',
		pathinfo: true
	},
	
	target: 'web',
	
	externals: {
		$: "jQuery",
		jquery: 'jQuery',
		google: 'google'
	},
	
	resolve: {
		modules: [
			'src',
			'modules',
			'node_modules'
		],
		extensions: [
			'.js',
			'.pug',
			'.css',
			'.scss',
			'.png',
			'.jpg'
		],
		alias: {
			'bootstrap.native': 'bootstrap.native/dist/bootstrap-native-v4',
		}
	},
	resolveLoader: {
		moduleExtensions: ['-loader']
	},
	// cache: true,
	module: {
		rules: [
			{
				test: /\.pug$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'pug',
						options: {
							pretty: true
						}
					}
				]
			},
			{
				test: /index.scss/,
				include: path.join(__dirname, 'src'),
				use: extractSCSS.extract({
					publicPath: '/assets/',
					fallback: 'style',
					use: [
						{
							loader: 'css',
							// options: {
							//   sourceMap: !isProd
							// }
						},
						{
							loader: 'autoprefixer'
						},
						{
							loader: 'resolve-url',
							options: {
								root: '../',
								keepQuery: true
							}
						},
						{
							loader: 'sass',
							options: {
								sourceMap: !isProd
							}
						}
					]
				})
			},
			{
				test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: [
					{
						loader: 'file',
						options: {
							publicPath: '/assets/',
							name: 'fonts/[name].[ext]'
						}
					}
				]
			},
			{
				test: /\.(png|gif|jpg|jpeg)$/,
				use: [
					{
						loader: 'file',
						options: {
							publicPath: '/assets/',
							name: 'img/[name].[ext]'
						}
					}
				]
			}
		],
	},
	
	plugins: getPlugins(),
	
	devServer: {
		headers: {
			"Access-Control-Allow-Origin": "http://localhost:3000",
			"Access-Control-Allow-Credentials": "true" },
		contentBase: outputPath,
		port: 3000
	}
};