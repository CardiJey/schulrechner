class Math_Element {
    constructor(type,left,value) {
        this.type = type
        if(left){
            this.neighbors = [left,undefined,left.neighbors[2],undefined] //left,bottom,right,top
            left.neighbors[2] = this
        }else{
            this.neighbors = [left,undefined,undefined,undefined] //left,bottom,right,top
        }
        this.value = value
    }
}

class Start_Element extends Math_Element{
    constructor(){
        super("start",undefined,NaN)
        this.prio = 0
    }
}

class Int_Element extends Math_Element{
    constructor(left,value){
        super("int",left,parseInt(value))
    }
}

class Plus_Element extends Math_Element{
    constructor(left){
        super("operation",left,"+")
        this.operation_type = "+"
        this.prio = 2
    }

    operate(val1,val2){
        return val1 + val2
    }
}

class Minus_Element extends Math_Element{
    constructor(left){
        super("operation",left,"-")
        this.operation_type = "-"
        this.prio = 2
    }

    operate(val1,val2){
        return val1 - val2
    }
}

class Times_Element extends Math_Element{
    constructor(left){
        super("operation",left,"\\times")
        this.operation_type = "x"
        this.prio = 3
    }

    operate(val1,val2){
        return val1 * val2
    }
}

class Div_Element extends Math_Element{
    constructor(left){
        super("operation",left,"\\div")
        this.operation_type = "÷"
        this.prio = 3
    }

    operate(val1,val2){
        return val1 / val2
    }
}

class Point_Element extends Math_Element{
    constructor(left){
        super("operation",left,",")
        this.operation_type = ","
        this.prio = 99
    }

    operate(val1,val2){
        let digits = Math.floor(Math.log10(val2)) + 1;
        return val1 + val2 / (10 ** digits)
    }
}

class Brackets_Element extends Math_Element{
    constructor(left,value){
        super("brackets",left,value)
        this.prio = 1
    }
}

class InputHandler {
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler) {
        this.input_code_history = [];
        this.display_input_element = display_input_element;
        this.display_output_element = display_output_element;
        this.math_input_element = math_input_element;
        this.math_output_element = math_output_element;
        this.parent_handler = parent_handler
    }

    // Method to handle input
    handle(input_code) {
        if(input_code == "key_ac"){
            this.input_code_history = []
        }else{
            this.input_code_history.push(input_code);
        }
        this.update_display();
    }

    formatNumber(num) {
        if(typeof num == "string"){
            return num
        }
        // Convert to scientific notation if there are 10 or more significant digits
        if (Math.abs(num) >= 1e10 || (num !== 0 && Math.abs(num) < 1e-10)) {
            return num.toExponential(9); // Adjust precision as needed
        }
        return num.toString();
    }

    update_display() {
        let [input_string, output_number] = this.parse_input_code_history(this.input_code_history);
        this.math_input_element.innerHTML = input_string
        this.math_output_element.innerHTML = "\\[" + this.formatNumber(output_number) + "\\]"

        MathJax.typesetPromise([this.math_input_element, this.math_output_element]).then(() => {
            this.adjust_mathjax_font_size(this.math_input_element);
            this.adjust_mathjax_font_size(this.math_output_element);
        });
    }

    update_position() {
        this.align_element(this.display_input_element, this.math_input_element, "left");
        this.align_element(this.display_output_element, this.math_output_element, "right");
    }

    align_element(displayElement, mathElement, align) {
        const rect = displayElement.getBoundingClientRect();
        mathElement.style.position = "absolute";
        mathElement.style.left = `${rect.left + window.scrollX}px`;
        mathElement.style.top = `${rect.top + window.scrollY}px`;
        mathElement.style.width = `${rect.width}px`;
        mathElement.style.height = `${rect.height}px`;
        this.fontSize = rect.height * 0.7
    }

    adjust_mathjax_font_size(mathElement) {
        const mathjaxContainer = mathElement.querySelector("mjx-container");

        if (mathjaxContainer) {
            // Check if the MathJax equation contains a fraction
            const hasFraction = mathjaxContainer.querySelector("mjx-mfrac") !== null;

            // If there's a fraction, halve the font size
            if (hasFraction) {
                mathjaxContainer.style.fontSize = `${this.fontSize * 0.5}px`;
            } else {
                mathjaxContainer.style.fontSize = `${this.fontSize}px`; // Reset if no fraction
            }
        }
    }

    math_elements_to_string(math_elements,last_cursor_element) {
        let res = "\\["
        let cursor_element = math_elements

        while(cursor_element){
            switch(cursor_element.type){
                case "start":
                    break;

                case "int":
                case "operation":
                case "brackets":
                    res += cursor_element.value
                    break;
            }
            if(cursor_element == last_cursor_element){
                res += "|"
            }
            cursor_element = cursor_element.neighbors[2]
        }

        res += "\\]"

        return res
    }

    calc_math_elements(current_element, last_operation_element, res=0) {
        if(!current_element){
            return [res,current_element]
        }

        switch(current_element.type){
            case "int":
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],last_operation_element,res * 10 + current_element.value)
            break;

            case "start":
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],current_element)
            break;

            case "operation":
                if(current_element.prio > last_operation_element.prio){
                    let [sub_res,sub_current_element] = this.calc_math_elements(current_element.neighbors[2],current_element,0)
                    res = current_element.operate(res,sub_res)
                    const result = this.calc_math_elements(sub_current_element, last_operation_element, res);
                    [res, current_element] = result;
                }
            break;

            case "brackets":
                // TODO machen das Klammern selber multiplizieren
                if(current_element.value == "("){
                    const result = this.calc_math_elements(current_element.neighbors[2],current_element,0);
                    let [inside_res,bracket_close_element] = result;
                    [res,current_element] = this.calc_math_elements(bracket_close_element.neighbors[2],last_operation_element,inside_res)
                }
            break;
        }

        return [res,current_element]
    }

    parse_input_code_history(input_code_history) {
        let res = new Start_Element()
        let cursor_element = res
        let calc_output = false

        for (const input_index in input_code_history) {
            let input_code = input_code_history[input_index]

            switch(input_code){
                case "key_0":
                case "key_1":
                case "key_2":
                case "key_3":
                case "key_4":
                case "key_5":
                case "key_6":
                case "key_7":
                case "key_8":
                case "key_9":
                    var new_element = new Int_Element(cursor_element,input_code.substring(4))
                    cursor_element = new_element
                break;

                case "key_dir0":
                case "key_dir1":
                case "key_dir2":
                case "key_dir3":
                    let dir = input_code.substring(7)
                    if(cursor_element.neighbors[dir]){
                        cursor_element = cursor_element.neighbors[dir]
                    }
                break;
                
                case "key_Ans":
                    break;

                case "key_=":
                    calc_output = true
                    active_input_handler = this.parent_handler
                    break;
                
                case "key_comma":
                    var new_element = new Point_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_x":
                    var new_element = new Times_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_÷":
                    var new_element = new Div_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_+":
                    var new_element = new Plus_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_-":
                    var new_element = new Minus_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_(":
                case "key_)":
                    var new_element = new Brackets_Element(cursor_element,input_code.substring(4))
                    cursor_element = new_element
                    break;

                case "key_del":
                    let old_cursor_element = cursor_element
                    if(cursor_element.type != "start"){
                        cursor_element = cursor_element.neighbors[0]
                        cursor_element.neighbors[2] = old_cursor_element.neighbors[2]
                        if(cursor_element.neighbors[2]){
                            cursor_element.neighbors[2].neighbors[0] = cursor_element
                        }
                    }
                    break;
            }
        }

        return [
            this.math_elements_to_string(res,cursor_element),
            (calc_output ? this.calc_math_elements(res)[0] : "")
        ]
    }
}

class EquationSelectInputHandler {
    constructor(display_input_element, math_input_element, display_output_element, math_output_element) {
        this.display_input_element = display_input_element;
        this.display_output_element = display_output_element;
        this.math_input_element = math_input_element;
        this.math_output_element = math_output_element;
        this.equations = []
        this.add_empty_equation()
        this.display_equation_index = 0
    }

    add_empty_equation(){
        this.equations.push(new InputHandler(this.display_input_element, this.math_input_element, this.display_output_element, this.math_output_element, this))
    }

    // Method to handle input
    handle(input_code) {
        switch(input_code){
            case "key_dir1":
                this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index + 1, this.equations.length - 1) )
                this.update_position();
                this.update_display();
            break;

            case "key_dir3":
                this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index - 1, this.equations.length - 1) )
                this.update_position();
                this.update_display();
            break;

            default:
                active_input_handler = this.equations[this.display_equation_index]
                active_input_handler.handle(input_code)
                active_input_handler.update_position();

                if(this.display_equation_index == this.equations.length - 1){
                    this.add_empty_equation()
                }
            break;
        }
    }

    update_display() {
        this.equations[this.display_equation_index].update_display();
    }


    update_position() {
        this.equations[this.display_equation_index].update_position();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let expression = "";
    const display = document.getElementById("display");
    const svgContainer = document.getElementById("svg-container");

    // Load the SVG dynamically
    fetch("img/gui.svg")
        .then(response => response.text())
        .then(data => {
            svgContainer.innerHTML = data;

            active_input_handler = new EquationSelectInputHandler(
                document.querySelector('[inkscape\\3a label="display_input"]'),
                document.getElementById("math-input"),
                document.querySelector('[inkscape\\3a label="display_output"]'),
                document.getElementById("math-output")
            );
            attachEventListeners();
        })
        .catch(error => console.error("Error loading SVG:", error));

    function attachEventListeners() {
        const keyElements = document.querySelectorAll('[inkscape\\3a label^="key_"]');

        keyElements.forEach(element => {
            element.addEventListener("mousedown", function () {
                active_input_handler.handle(this.getAttribute('inkscape:label'));
            });
        });
    }
});
