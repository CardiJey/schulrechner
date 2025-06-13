/*
Total Workflow of using the Schulrechner:

UI loads -> pointer_events assigned to keys -> 
pointerdown event on key -> key input_code sent to handle function of input_handler -> input_handler builds math.js string -> 
math.js evaluates string -> input_handler creates rendered_input and rendered_output -> set as innerHTML of display elements ->
CSS styles input and results

What does this test test?
Everything from the call of the handle function of the input_handler to setting the innerHTML of the display
*/

const { test, describe } = require('node:test');
const assert = require('node:assert');
const math = require('../www/js/math.js');

const { InputHandler, EquationSelectInputHandler } = require('../www/js/logic')

class Dummy_Element{
    constructor(){
        this.innerHTML = ""
    }
    scroll(x,y){}
}

class Dummy_UI{
    constructor(){}
    async fetchChangelog(fdroid){}
    toggle_changelog(){}
    setRootFontSize(size){}
    handle_resize(){}
    vertical_align_elements() {}
    toggle_indicators(modes){}
    scroll_element(this_element){}
    align_element(displayElement, mathElement){}
}

function eval_input_history(input_history,userLang){
    let dummy_display_input_element = new Dummy_Element()
    let dummy_math_input_element = new Dummy_Element()
    let dummy_display_output_element = new Dummy_Element()
    let dummy_math_output_element = new Dummy_Element()

    let dummy_ui = new Dummy_UI()

    let global_logic_vars = {
        "active_input_handler": undefined,
        "next_align_id": 0,
        "next_subres_id": 0,
        "math_engine": math
    }
    global_logic_vars.active_input_handler = new EquationSelectInputHandler(dummy_display_input_element, dummy_math_input_element, dummy_display_output_element, dummy_math_output_element, global_logic_vars, dummy_ui, userLang)

    for(input_index = 0; input_index < input_history.length; input_index++){
        const input_code = input_history[input_index]

        global_logic_vars.active_input_handler.handle(input_code)
    }

    return [dummy_math_input_element.innerHTML,dummy_math_output_element.innerHTML]
}

// You can get the expected test results and inputs by running:
// {"name":"INSERT_TEST_NAME","input_history":global_logic_vars.active_input_handler.equations[global_logic_vars.active_input_handler.equations.length - 1].input_code_history,"rendered_input":global_logic_vars.active_input_handler.math_input_element.innerHTML,"rendered_output":global_logic_vars.active_input_handler.math_output_element.innerHTML}
// in the developer console of the browser version of the Schulrechner.

const tests = [
    {"userLang":'de-DE',"name":'no input test',"input_history":[],"rendered_input":"","rendered_output":""},
    {"userLang":'de-DE',"name":'integer test',"input_history":['key_5', 'key_2', 'key_4', 'key_6', 'key_8', 'key_7', 'key_5', 'key_0', 'key_1', 'key_='],"rendered_input":'524687501\u00A0',"rendered_output":'524687501'},
    {"userLang":'de-DE',"name":'addition test',"input_history":['key_1', 'key_3', 'key_4', 'key_5', 'key_+', 'key_3', 'key_2', 'key_6', 'key_7', 'key_='],"rendered_input":"1345+3267\u00A0","rendered_output":"4612"},
    {"userLang":'de-DE',"name":'float test',"input_history":['key_4', 'key_2', 'key_5', 'key_comma', 'key_7', 'key_3', 'key_6', 'key_4', 'key_8', 'key_7', 'key_='],"rendered_input":"425,736487\u00A0","rendered_output":"425,736487"},
    {"userLang":'de-DE',"name":'fraction approximation test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_='],"rendered_input":"23,456\u00A0","rendered_output":"<span class='frac_wrapper'><span class='frac_top'>2932</span><span class='frac_bottom'>125</span></span>"},
    {"userLang":'de-DE',"name":'fraction to float test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_=', 'key_SD'],"rendered_input":"23,456\u00A0","rendered_output":"23,456"},
    {"userLang":'de-DE',"name":'fraction to float to fraction test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_=', 'key_SD', 'key_SD'],"rendered_input":"23,456\u00A0","rendered_output":"<span class='frac_wrapper'><span class='frac_top'>2932</span><span class='frac_bottom'>125</span></span>"},
    {
        "userLang":'de-DE',
        "name": "float addition test",
        "input_history": [
            "key_4",
            "key_2",
            "key_5",
            "key_comma",
            "key_3",
            "key_2",
            "key_+",
            "key_4",
            "key_1",
            "key_2",
            "key_5",
            "key_comma",
            "key_3",
            "key_2",
            "key_6",
            "key_="
        ],
        "rendered_input": "425,32+4125,326 ",
        "rendered_output": "4550,646"
    },
    {
        "userLang":'de-DE',
        "name": "float subtraction test",
        "input_history": [
            "key_1",
            "key_2",
            "key_4",
            "key_3",
            "key_comma",
            "key_1",
            "key_2",
            "key_-",
            "key_4",
            "key_1",
            "key_6",
            "key_comma",
            "key_2",
            "key_7",
            "key_8",
            "key_9",
            "key_="
        ],
        "rendered_input": "1243,12-416,2789 ",
        "rendered_output": "826,8411"
    },
    {
        "userLang":'de-DE',
        "name": "float division test",
        "input_history": [
            "key_4",
            "key_2",
            "key_6",
            "key_comma",
            "key_2",
            "key_5",
            "key_÷",
            "key_0",
            "key_comma",
            "key_2",
            "key_5",
            "key_3",
            "key_="
        ],
        "rendered_input": "426,25÷0,253 ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">38750</span><span class=\"frac_bottom\">23</span></span>"
    },
    {
        "userLang":'de-DE',
        "name": "float multiplication test",
        "input_history": [
            "key_2",
            "key_3",
            "key_4",
            "key_comma",
            "key_2",
            "key_5",
            "key_x",
            "key_8",
            "key_7",
            "key_9",
            "key_3",
            "key_comma",
            "key_1",
            "key_="
        ],
        "rendered_input": "234,25×8793,1 ",
        "rendered_output": "2059783,675"
    },
    {
        "userLang":'de-DE',
        "name": "integer fraction test",
        "input_history": [
            "key_4",
            "key_2",
            "key_6",
            "key_frac",
            "key_7",
            "key_4",
            "key_5",
            "key_8",
            "key_="
        ],
        "rendered_input": "<span class=\"alignLeft5\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-6.5875px + 0.06rem);\"><span class=\"frac_top\">426</span><span class=\"frac_bottom alignRight5\">7458</span></span> ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">71</span><span class=\"frac_bottom\">1243</span></span>"
    },
    {
        "userLang":'de-DE',
        "name": "float sqrt test",
        "input_history": [
            "key_sqrt",
            "key_7",
            "key_5",
            "key_4",
            "key_comma",
            "key_3",
            "key_5",
            "key_="
        ],
        "rendered_input": "<span class=\"sqrt_wrapper\"><span class=\"scale_height\">√</span><span class=\"sqrt\">754,35</span></span> ",
        "rendered_output": "27,46543282"
    },
    {
        "userLang":'de-DE',
        "name": "scientific result notation test",
        "input_history": [
            "key_1",
            "key_5",
            "key_4",
            "key_3",
            "key_7",
            "key_8",
            "key_6",
            "key_4",
            "key_2",
            "key_5",
            "key_8",
            "key_9",
            "key_1",
            "key_5",
            "key_3",
            "key_8",
            "key_="
        ],
        "rendered_input": "1543786425891538 ",
        "rendered_output": "1,543786426<span class='pow10'>×⒑</span><span class='pow_top'>15</span>"
    },
    {
        "userLang":'de-DE',
        "name": "pow test",
        "input_history": [
            "key_1",
            "key_5",
            "key_0",
            "key_2",
            "key_3",
            "key_8",
            "key_pow2",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_bottom\">(150238)</span><span class=\"pow_top\">2</span> ",
        "rendered_output": "2,257145664<span class='pow10'>×⒑</span><span class='pow_top'>10</span>"
    },
    {
        "userLang":'de-DE',
        "name": "pow n test",
        "input_history": [
            "key_1",
            "key_2",
            "key_comma",
            "key_5",
            "key_pown",
            "key_1",
            "key_comma",
            "key_7",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_bottom\">(12,5)</span><span class=\"pow_top\">1,7</span> ",
        "rendered_output": "73,23977849"
    },
    {
        "userLang":'de-DE',
        "name": "log test",
        "input_history": [
            "key_log",
            "key_1",
            "key_6",
            "key_comma",
            "key_8",
            "key_)",
            "key_="
        ],
        "rendered_input": "log(16,8) ",
        "rendered_output": "1,225309282"
    },
    {
        "userLang":'de-DE',
        "name": "ln test",
        "input_history": [
            "key_ln",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_)",
            "key_="
        ],
        "rendered_input": "ln(9999) ",
        "rendered_output": "9,210240367"
    },
    {
        "userLang":'de-DE',
        "name": "pow-1 test",
        "input_history": [
            "key_4",
            "key_5",
            "key_3",
            "key_comma",
            "key_2",
            "key_9",
            "key_pow-1",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_bottom\">(453,29)</span><span class=\"pow_top\">-1</span> ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">100</span><span class=\"frac_bottom\">45329</span></span>"
    },
    {
        "userLang":'de-DE',
        "name": "log n test",
        "input_history": [
            "key_logn",
            "key_9",
            "key_8",
            "key_comma",
            "key_5",
            "key_dir2",
            "key_8",
            "key_5",
            "key_4",
            "key_2",
            "key_9",
            "key_="
        ],
        "rendered_input": "log<span class=\"logn_bottom\">98,5</span>(85429) ",
        "rendered_output": "2,473921788"
    },
    {
        "userLang":'de-DE',
        "name": "third root test",
        "input_history": [
            "key_sqrt3",
            "key_4",
            "key_5",
            "key_comma",
            "key_9",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_top\">3</span><span class=\"sqrt_wrapper\"><span class=\"scale_height\">√</span><span class=\"sqrt\">45,9</span></span> ",
        "rendered_output": "3,580449576"
    },
    {
        "userLang":'de-DE',
        "name": "pow n test",
        "input_history": [
            "key_3",
            "key_2",
            "key_comma",
            "key_4",
            "key_pow3",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_bottom\">(32,4)</span><span class=\"pow_top\">3</span> ",
        "rendered_output": "34012,224"
    },
    {
        "userLang":'de-DE',
        "name": "INSERT_TEST_NAME",
        "input_history": [
            "key_sqrtn",
            "key_7",
            "key_dir2",
            "key_4",
            "key_2",
            "key_6",
            "key_8",
            "key_comma",
            "key_2",
            "key_5",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_top\">7</span><span class=\"sqrt_wrapper\"><span class=\"scale_height\">√</span><span class=\"sqrt\">4268,25</span></span> ",
        "rendered_output": "3,300708118"
    },
    {
        "userLang":'de-DE',
        "name": "integer faculty test",
        "input_history": [
            "key_8",
            "key_faculty",
            "key_="
        ],
        "rendered_input": "8! ",
        "rendered_output": "40320"
    },
    {
        "userLang":'de-DE',
        "name": "INSERT_TEST_NAME",
        "input_history": [
            "key_epow",
            "key_8",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_bottom\">(e)</span><span class=\"pow_top\">8</span> ",
        "rendered_output": "2980,957987"
    },
    {
        "userLang":'de-DE',
        "name": "pi test",
        "input_history": [
            "key_pi",
            "key_="
        ],
        "rendered_input": "π ",
        "rendered_output": "3,141592654"
    },
    {
        "userLang":'de-DE',
        "name": "INSERT_TEST_NAME",
        "input_history": [
            "key_e",
            "key_="
        ],
        "rendered_input": "e ",
        "rendered_output": "2,718281828"
    },
    {
        "userLang":'de-DE',
        "name": "pow 10 integer test",
        "input_history": [
            "key_4",
            "key_2",
            "key_pow10",
            "key_6",
            "key_="
        ],
        "rendered_input": "42<span class=\"pow10\">×⒑</span>6 ",
        "rendered_output": "42000000"
    },
    {
        "userLang":'de-DE',
        "name": "ans test",
        "input_history": [
            "key_4",
            "key_+",
            "key_2",
            "key_=",
            "key_Ans",
            "key_+",
            "key_8",
            "key_="
        ],
        "rendered_input": "Ans+8 ",
        "rendered_output": "14"
    },
    {
        "userLang":'de-DE',
        "name": "auto ans test",
        "input_history": [
            "key_5",
            "key_+",
            "key_7",
            "key_=",
            "key_x",
            "key_3",
            "key_="
        ],
        "rendered_input": "Ans×3 ",
        "rendered_output": "36"
    },
    {
        "userLang":'de-DE',
        "name": "order of basic operations test",
        "input_history": [
            "key_1",
            "key_2",
            "key_+",
            "key_4",
            "key_x",
            "key_5",
            "key_-",
            "key_8",
            "key_÷",
            "key_3",
            "key_+",
            "key_7",
            "key_="
        ],
        "rendered_input": "12+4×5-8÷3+7 ",
        "rendered_output": "36,33333333"
    },
    {
        "userLang":'de-DE',
        "name": "brackets test",
        "input_history": [
            "key_5",
            "key_+",
            "key_(",
            "key_1",
            "key_2",
            "key_+",
            "key_4",
            "key_)",
            "key_x",
            "key_8",
            "key_="
        ],
        "rendered_input": "5+(12+4)×8 ",
        "rendered_output": "133"
    },
    {
        "userLang":'de-DE',
        "name": "implicit multiplication test",
        "input_history": [
            "key_1",
            "key_2",
            "key_shift",
            "key_pow10",
            "key_+",
            "key_5",
            "key_(",
            "key_3",
            "key_-",
            "key_7",
            "key_)",
            "key_-",
            "key_8",
            "key_log",
            "key_4",
            "key_)",
            "key_="
        ],
        "rendered_input": "12π+5(3-7)-8log(4) ",
        "rendered_output": "12,88263191"
    },
    {
        "userLang":'de-DE',
        "name": "sin cos tan test",
        "input_history": [
            "key_sin",
            "key_1",
            "key_4",
            "key_)",
            "key_-",
            "key_cos",
            "key_3",
            "key_2",
            "key_)",
            "key_+",
            "key_tan",
            "key_8",
            "key_)",
            "key_="
        ],
        "rendered_input": "sin(14)-cos(32)+tan(8) ",
        "rendered_output": "-0,4655853659"
    },
    {
        "userLang":'de-DE',
        "name": "user variables test",
        "input_history": [
            "key_4",
            "key_5",
            "key_+",
            "key_8",
            "key_shift",
            "key_rcl",
            "key_(-)",
            "key_8",
            "key_-",
            "key_4",
            "key_alpha",
            "key_(-)",
            "key_shift",
            "key_rcl",
            "key_°",
            "key_alpha",
            "key_(-)",
            "key_+",
            "key_alpha",
            "key_°",
            "key_-",
            "key_alpha",
            "key_SD",
            "key_="
        ],
        "rendered_input": "A+B-Y ",
        "rendered_output": "-151"
    },
    {
        "userLang":'de-DE',
        "name": "inline cursor movement test",
        "input_history": [
            "key_1",
            "key_4",
            "key_dir0",
            "key_7",
            "key_dir2",
            "key_3",
            "key_5",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_8",
            "key_-",
            "key_dir2",
            "key_dir2",
            "key_dir2",
            "key_dir2",
            "key_dir2",
            "key_5",
            "key_dir0",
            "key_2",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_7",
            "key_="
        ],
        "rendered_input": "12578-4735 ",
        "rendered_output": "7843"
    },
    {
        "userLang":'de-DE',
        "name": "fraction cursor movement test",
        "input_history": [
            "key_frac",
            "key_7",
            "key_+",
            "key_frac",
            "key_9",
            "key_-",
            "key_3",
            "key_dir1",
            "key_5",
            "key_+",
            "key_frac",
            "key_3",
            "key_dir1",
            "key_7",
            "key_dir3",
            "key_dir1",
            "key_dir1",
            "key_7",
            "key_-",
            "key_frac",
            "key_8",
            "key_dir1",
            "key_4",
            "key_6",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir3",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir3",
            "key_2",
            "key_="
        ],
        "rendered_input": "<span class=\"alignLeft120\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-17.1625px + 0.06rem);\"><span class=\"frac_top\">7+<span class=\"alignLeft121\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-20.3625px + 0.06rem);\"><span class=\"frac_top\">9-32</span><span class=\"frac_bottom alignRight121\">5+<span class=\"alignLeft122\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-9.7875px + 0.06rem);\"><span class=\"frac_top\">3</span><span class=\"frac_bottom alignRight122\">7</span></span></span></span></span><span class=\"frac_bottom alignRight120\">7-<span class=\"alignLeft123\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-9.7875px + 0.06rem);\"><span class=\"frac_top\">8</span><span class=\"frac_bottom alignRight123\">46</span></span></span></span> ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">2415</span><span class=\"frac_bottom\">5966</span></span>"
    },
    {
        "userLang":'de-DE',
        "name": "block inclusion in container operations",
        "input_history": [
            "key_7",
            "key_8",
            "key_frac",
            "key_3",
            "key_dir2",
            "key_-",
            "key_7",
            "key_8",
            "key_5",
            "key_+",
            "key_4",
            "key_frac",
            "key_(",
            "key_3",
            "key_-",
            "key_4",
            "key_)",
            "key_frac",
            "key_4",
            "key_dir2",
            "key_dir2",
            "key_-",
            "key_(",
            "key_3",
            "key_x",
            "key_2",
            "key_)",
            "key_pow2",
            "key_frac",
            "key_7",
            "key_="
        ],
        "rendered_input": "<span class=\"alignLeft62\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-6.58749px + 0.06rem);\"><span class=\"frac_top\">78</span><span class=\"frac_bottom alignRight62\">3</span></span>-785+<span class=\"alignLeft63\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-17.1625px + 0.06rem);\"><span class=\"frac_top\">4</span><span class=\"frac_bottom alignRight63\"><span class=\"alignLeft64\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-9.7875px + 0.06rem);\"><span class=\"frac_top\">(3-4)</span><span class=\"frac_bottom alignRight64\">4</span></span></span></span>-<span class=\"alignLeft65\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-6.58749px + 0.06rem);\"><span class=\"frac_top\"><span class=\"pow_bottom\">((3×2))</span><span class=\"pow_top\">2</span></span><span class=\"frac_bottom alignRight65\">7</span></span> ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">-5461</span><span class=\"frac_bottom\">7</span></span>"
    },
    {
        "userLang":'de-DE',
        "name": "ac test",
        "input_history": [
            "key_4",
            "key_5",
            "key_7",
            "key_8",
            "key_ac",
            "key_3",
            "key_-",
            "key_5",
            "key_ac",
            "key_5",
            "key_x",
            "key_8",
            "key_="
        ],
        "rendered_input": "5×8 ",
        "rendered_output": "40"
    },
    {
        "userLang":'de-DE',
        "name": "del integer test",
        "input_history": [
            "key_4",
            "key_5",
            "key_7",
            "key_del",
            "key_9",
            "key_del",
            "key_del",
            "key_6",
            "key_5",
            "key_dir0",
            "key_dir0",
            "key_del",
            "key_3",
            "key_5",
            "key_dir2",
            "key_del",
            "key_="
        ],
        "rendered_input": "355 ",
        "rendered_output": "355"
    },
    {
        "userLang":'de-DE',
        "name": "frac deletion",
        "input_history": [
            "key_frac",
            "key_5",
            "key_4",
            "key_dir2",
            "key_5",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_del"
        ],
        "rendered_input": "<span class=\"cursor\"></span>545 ",
        "rendered_output": ""
    },
    {
        "userLang":'de-DE',
        "name": "mixed test",
        "input_history": [
            "key_frac",
            "key_7",
            "key_8",
            "key_x",
            "key_sqrt",
            "key_9",
            "key_log",
            "key_8",
            "key_)",
            "key_dir2",
            "key_dir2",
            "key_6",
            "key_÷",
            "key_sin",
            "key_7",
            "key_8",
            "key_x",
            "key_cos",
            "key_5",
            "key_)",
            "key_dir2",
            "key_pow-1",
            "key_+",
            "key_5",
            "key_shift",
            "key_pow10",
            "key_dir0",
            "key_dir0",
            "key_(",
            "key_dir2",
            "key_dir2",
            "key_+",
            "key_8",
            "key_shift",
            "key_sqrt",
            "key_7",
            "key_dir2",
            "key_)",
            "key_pown",
            "key_7",
            "key_=",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_dir0",
            "key_)",
            "key_=",
            "key_frac",
            "key_Ans",
            "key_dir2",
            "key_5",
            "key_x",
            "key_logn",
            "key_3",
            "key_dir2",
            "key_8",
            "key_5",
            "key_x",
            "key_8",
            "key_pow2",
            "key_-",
            "key_shift",
            "key_ln",
            "key_4",
            "key_dir2",
            "key_dir2",
            "key_dir2",
            "key_-",
            "key_frac",
            "key_7",
            "key_shift",
            "key_pow-1",
            "key_dir2",
            "key_(",
            "key_8",
            "key_+",
            "key_9",
            "key_-",
            "key_4",
            "key_)",
            "key_shift",
            "key_pow-1",
            "key_dir2",
            "key_shift",
            "key_rcl",
            "key_(-)"
        ],
        "rendered_input": "<span class=\"alignLeft118\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-15.3875px + 0.06rem);\"><span class=\"frac_top\">Ans</span><span class=\"frac_bottom alignRight118\">5×log<span class=\"logn_bottom\">3</span>(85×<span class=\"pow_bottom\">(8)</span><span class=\"pow_top\">2</span>-<span class=\"pow_bottom\">(e)</span><span class=\"pow_top\">4</span>)</span></span>-<span class=\"alignLeft119\"></span><span class=\"frac_wrapper\" style=\"vertical-align: calc(-6.58749px + 0.06rem);\"><span class=\"frac_top\">7!</span><span class=\"frac_bottom alignRight119\">(8+9-4)!</span></span>→A ",
        "rendered_output": "705438210,2"
    },
    {
        "userLang": "en-US",
        "name": "different userLang test",
        "input_history": [
            "key_1",
            "key_comma",
            "key_1",
            "key_=",
            "key_SD"
        ],
        "rendered_input": "1.1 ",
        "rendered_output": "1.1"
    },
    {
        "userLang": "en-US",
        "name": "does NOT default to fraction test 1",
        "input_history": [
            "key_0",
            "key_comma",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_9",
            "key_="
        ],
        "rendered_input": "0.00000009 ",
        "rendered_output": "9<span class='pow10'>×⒑</span><span class='pow_top'>-8</span>"
    },
    {
        "userLang": "en-US",
        "name": "DOES default to fraction test",
        "input_history": [
            "key_0",
            "key_comma",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_="
        ],
        "rendered_input": "0.00000009999999 ",
        "rendered_output": "<span class=\"frac_wrapper\"><span class=\"frac_top\">1</span><span class=\"frac_bottom\">10000001</span></span>"
    },
    {
        "userLang": "en-US",
        "name": "does NOT default to fraction test 3",
        "input_history": [
            "key_0",
            "key_comma",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_="
        ],
        "rendered_input": "0.000000099999999 ",
        "rendered_output": "9.9999999<span class='pow10'>×⒑</span><span class='pow_top'>-8</span>"
    }
]

const known_to_fail_tests = [
    {
        "userLang":'de-DE',
        "name": "negative third root test",
        "input_history": [
            "key_sqrt3",
            "key_-",
            "key_2",
            "key_7",
            "key_="
        ],
        "rendered_input": "<span class=\"pow_top\">3</span><span class=\"sqrt_wrapper\"><span class=\"scale_height\">√</span><span class=\"sqrt\">-27</span></span> ",
        "rendered_output": "-3"
    },
    {
        "userLang": "en-US",
        "name": "should NOT default to fraction test 2",
        "input_history": [
            "key_0",
            "key_comma",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_0",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_9",
            "key_="
        ],
        "rendered_input": "0.0000000999999 ",
        "rendered_output": "9<span class='pow10'>×⒑</span><span class='pow_top'>-8</span>"
    }
]


describe(`⚙️ Automated Tests`, () => {
    for(let test_index = 0; test_index < tests.length; test_index++){
        let this_test = tests[test_index]
        let this_userLang = this_test.userLang
        let rendered_input = this_test.rendered_input.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')
        let rendered_output = this_test.rendered_output.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')

        test(this_test.name, (t) => {
            assert.deepStrictEqual(
                eval_input_history(this_test.input_history,this_userLang),
                [rendered_input,rendered_output]
            );
        })
    }
    for(let test_index = 0; test_index < known_to_fail_tests.length; test_index++){
        let this_test = known_to_fail_tests[test_index]
        let this_userLang = this_test.userLang
        let rendered_input = this_test.rendered_input.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')
        let rendered_output = this_test.rendered_output.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')

        test.todo(this_test.name, (t) => {
            assert.deepStrictEqual(
                eval_input_history(this_test.input_history,this_userLang),
                [rendered_input,rendered_output]
            );
        })
    }
})