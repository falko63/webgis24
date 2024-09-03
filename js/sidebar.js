let openBar = undefined;

const infobar_open_width = 350;
const infobar_close_width = 60;
const infobar_padding_left = 20;
const infobar_total = infobar_open_width + infobar_close_width + infobar_padding_left;

function info(bar) {
    //console.log(openBar, bar);
    if ( openBar == undefined ) {
        infoOpen(bar);
    } else if ( openBar == bar ) {
        infoCloseAll();
    } else if ( openBar != bar ) {
        infoCloseAll();
        infoOpen(bar);
    }
}
// Das window-Objekt ist die oberste Instanz.
// In ihr werden bspw. auch globale Variablen abgelegt.
// Eine Funktion wird in der folgenden Codezeile zur
// globalen Funktion, weil sie zum window-Objekt
// hinzugefügt wird, und kann so in einer HTML-Datei
// verwendet werden.
// Die Namen müssen nicht identisch sein.
window.info = info;

function infoOpen(bar) {
    document.getElementById(bar).style.width = infobar_open_width + "px";
    document.getElementById(bar).style.paddingLeft = infobar_padding_left + "px";
    document.getElementById("main").style.marginLeft = infobar_total + "px";
    openBar = bar;
}

function infoCloseAll() {
    let bars = document.getElementsByClassName('infobar');
    for (let bar of bars) {
        bar.style.width = "0";
        bar.style.paddingLeft = "0"
    }
    document.getElementById("main").style.marginLeft = infobar_close_width + "px";
    openBar = undefined;
}
/* siehe oben */
window.infoCloseAll = infoCloseAll;
