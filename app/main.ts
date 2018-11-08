import Vue, { registerElement } from "nativescript-vue"

import "./styles.scss"
import { isAndroid, isIOS } from "platform"

import AuthService from "./services/AuthService"

export const authService = new AuthService()

// if (TNS_ENV !== "production") {
//   import("nativescript-vue-devtools").then(VueDevtools => Vue.use(VueDevtools));
// }

// Prints Vue logs when --env.production is *NOT* set while building
Vue.config.silent = TNS_ENV !== "development"
Vue.config["debug"] = TNS_ENV === "development"

Vue.prototype.$authService = authService

// import CollectionView from "nativescript-collectionview/vue";
// Vue.use(CollectionView);

import { primaryColor } from "./variables"
import { themer } from "~/nativescript-material-components/material"
if (isIOS) {
    //material theme
    themer.setPrimaryColor(primaryColor)
}

registerElement(
    "MDCButton",
    () => require("~/nativescript-material-components/button").Button
)
registerElement(
    "HTMLLabel",
    () => require("nativescript-htmllabel/label").Label
)
registerElement(
    "MDCTextField",
    () => require("~/nativescript-material-components/textfield").TextField,
    {
        model: {
            prop: "text",
            event: "textChange"
        }
    }
)
// registerElement("CardView", () => require('~/nativescript-material-components/cardview').CardView);

import App from "~/components/App.vue"
import Login from "~/components/Login.vue"

// import { SVGImage } from '@teammaestro/nativescript-svg';
// registerElement('SVGImage', () => SVGImage);

import { fonticon, TNSFontIcon } from "nativescript-fonticon"
TNSFontIcon.paths = {
    mdi: "./assets/mdi.css"
}
TNSFontIcon.loadCss()
Vue.filter("fonticon", fonticon)

import VueStringFilter from "vue-string-filter/VueStringFilter"
Vue.use(VueStringFilter)

import { localize } from "nativescript-localize"
Vue.filter("L", localize)

Vue.prototype.$isAndroid = isAndroid
Vue.prototype.$isIOS = isIOS
const filters = (Vue.prototype.$filters = Vue["options"].filters)
Vue.prototype.$ltc = function(s: string, ...args) {
    return filters.titlecase(localize(s, ...args))
}
Vue.prototype.$luc = function(s: string, ...args) {
    return filters.uppercase(localize(s, ...args))
}


Vue.prototype.$showError = function(err: Error) {
    return alert({
        title: this.$ltc("error"),
        okButtonText: this.$ltc("ok"),
        message: err.toString()
    })
}
Vue.prototype.$alert = function(message) {
    return alert({
        okButtonText: this.$ltc("ok"),
        message: message
    })
}

new Vue({
    render: h => {
        return h("frame", [h(authService.isLoggedIn() ? App : Login)])
    }
}).$start()
