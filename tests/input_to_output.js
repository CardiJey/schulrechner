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

test('basic test', (t) => {
    assert.deepStrictEqual(
        eval_input_history(["key_1","key_+","key_1","key_="]),
        ["1+1\u00A0","2"]
    );
});