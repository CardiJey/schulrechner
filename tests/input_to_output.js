const test = require('node:test');
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

function eval_input_history(input_history){
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
    global_logic_vars.active_input_handler = new EquationSelectInputHandler(dummy_display_input_element, dummy_math_input_element, dummy_display_output_element, dummy_math_output_element, global_logic_vars, dummy_ui)

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
    {"name":'no input test',"input_history":[],"rendered_input":"","rendered_output":""},
    {"name":'integer test',"input_history":['key_5', 'key_2', 'key_4', 'key_6', 'key_8', 'key_7', 'key_5', 'key_0', 'key_1', 'key_='],"rendered_input":'524687501\u00A0',"rendered_output":'524687501'},
    {"name":'addition test',"input_history":['key_1', 'key_3', 'key_4', 'key_5', 'key_+', 'key_3', 'key_2', 'key_6', 'key_7', 'key_='],"rendered_input":"1345+3267\u00A0","rendered_output":"4612"},
    {"name":'float test',"input_history":['key_4', 'key_2', 'key_5', 'key_comma', 'key_7', 'key_3', 'key_6', 'key_4', 'key_8', 'key_7', 'key_='],"rendered_input":"425,736487\u00A0","rendered_output":"425.736487"},
    {"name":'fraction approximation test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_='],"rendered_input":"23,456\u00A0","rendered_output":"<span class='frac_wrapper'><span class='frac_top'>2932</span><span class='frac_bottom'>125</span></span>"},
    {"name":'fraction to float test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_=', 'key_SD'],"rendered_input":"23,456\u00A0","rendered_output":"23.456"},
    {"name":'fraction to float to fraction test',"input_history":['key_2', 'key_3', 'key_comma', 'key_4', 'key_5', 'key_6', 'key_=', 'key_SD', 'key_SD'],"rendered_input":"23,456\u00A0","rendered_output":"<span class='frac_wrapper'><span class='frac_top'>2932</span><span class='frac_bottom'>125</span></span>"},
    {
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
        "rendered_output": "4550.646"
    },
    {
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
        "rendered_output": "826.8411"
    },
    {
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
        "rendered_output": "2059783.675"
    },
    {
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
        "rendered_output": "27.46543282"
    },
    {
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
        "rendered_output": "1.543786426e+15"
    },
    {
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
        "rendered_output": "2.257145664e+10"
    }
]

for(let test_index = 0; test_index < tests.length; test_index++){
    let this_test = tests[test_index]
    let rendered_input = this_test.rendered_input.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')
    let rendered_output = this_test.rendered_output.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')

    test(this_test.name, (t) => {
        assert.deepStrictEqual(
            eval_input_history(this_test.input_history),
            [rendered_input,rendered_output]
        );
    })
}