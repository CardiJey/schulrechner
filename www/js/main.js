let active_input_handler;
let next_align_id = 0

function is_family(el1, el2){
    if(el1 && el2){
        let parent_el;
        let child_el;
        if(el1.type == "container_operation"){
            parent_el = el1
            child_el = el2
        }else if(el2.type == "container_operation"){
            parent_el = el2
            child_el = el1
        }else{
            if(el1.type == "container" && el2.type == "container"){
                return el1.parent == el2.parent
            }else{
                return false
            }
        }

        if(child_el.type == "container"){
            return parent_el == child_el.parent
        }
    }
    
    return false
}

class Math_Element {
    constructor(type,left,value,allowed_right_neighbor) {
        this.type = type
        if(left){
            this.neighbors = [left,undefined,left.neighbors[2],undefined] //left,bottom,right,top
            left.neighbors[2] = this
        }else{
            this.neighbors = [left,undefined,undefined,undefined] //left,bottom,right,top
        }
        this.value = value
        this.allowed_right_neighbor = allowed_right_neighbor
    }
}

class Start_Element extends Math_Element{
    constructor(){
        super("start",undefined,NaN,["*"])
        this.prio = 0
    }
}

class Int_Element extends Math_Element{
    constructor(left,value){
        super("int",left,parseInt(value),["additive_operation","multi_operation","container","brackets_close","ans"])
    }
}

class Plus_Element extends Math_Element{
    constructor(left){
        super("additive_operation",left,"+",["container_operation","brackets_operation","int","ans"])
        this.operation_type = "+"
        this.prio = 2
    }

    operate(val1,val2){
        return val1 + val2
    }
}

class Minus_Element extends Math_Element{
    constructor(left){
        super("additive_operation",left,"-",["container_operation","brackets_operation","int","ans"])
        this.operation_type = "-"
        this.prio = 2
    }

    operate(val1,val2){
        return val1 - val2
    }
}

class Times_Element extends Math_Element{
    constructor(left){
        super("multi_operation",left,"×",["container_operation","brackets_operation","int","ans"])
        this.operation_type = "×"
        this.prio = 3
    }

    operate(val1,val2){
        return val1 * val2
    }
}

class Div_Element extends Math_Element{
    constructor(left){
        super("multi_operation",left,"÷",["container_operation","brackets_operation","int","ans"])
        this.operation_type = "÷"
        this.prio = 3
    }

    operate(val1,val2){
        return val1 / val2
    }
}

class Point_Element extends Math_Element{
    constructor(left){
        super("point_operation",left,",",["int"])
        this.operation_type = ","
        this.prio = 99
    }

    operate(val1,val2){
        let digits = Math.floor(Math.log10(val2));

        return val1 + (val2 - Math.pow(10,digits)) / (10 ** digits)
    }
}

class Brackets_Element extends Math_Element{
    constructor(left,value){
        super("brackets_operation",left,"(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return val
    }
}

class Brackets_Close_Element extends Math_Element{
    constructor(left,value){
        super("brackets_close",left,")",["additive_operation","multi_operation"])
        this.prio = 1
    }
}

class Frac_Element extends Math_Element{
    constructor(left){
        let align_id = next_align_id
        next_align_id++
        super("container_operation",left,"<span class='alignLeft" + align_id + "'></span><span class='frac_wrapper'><span class='frac_top'>",["additive_operation","container_operation","brackets_operation","int","ans"])
        
        this.children = [
            new Container_Element(this,"</span><span class='frac_bottom alignRight" + align_id + "'>",this,false)
        ]
        this.children.push(
            new Container_Element(this.children[0],"</span></span>",this,true)
        )
        this.neighbors[1] = this.children[0]
        this.children[0].neighbors[3] = this
        this.prio = 1
    }

    operate(child_results){
        return child_results[0] / child_results[1]
    }
}

class Sqrt_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"<span class='sqrt_wrapper'><span class='scale_height'>&#8730;</span><span class='sqrt'>",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.children = [
            new Container_Element(this,"</span></span>",this,true)
        ]
        this.prio = 1
    }

    operate(child_results){
        return Math.sqrt(child_results[0])
    }
}

class Pow_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"<span class='pow_bottom'>(",["additive_operation","container_operation","brackets_operation","int","ans"])
        
        this.children = [
            new Container_Element(this,")</span><span class='pow_top'>",this,false)
        ]
        this.children.push(
            new Container_Element(this.children[0],"</span>",this,true)
        )
        this.prio = 1
    }

    operate(child_results){
        return Math.pow(child_results[0],child_results[1])
    }
}
class Logn_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"log<span class='logn_bottom'>",["additive_operation","container_operation","brackets_operation","int","ans"])
        
        this.children = [
            new Container_Element(this,"</span>(",this,false)
        ]
        this.children.push(
            new Container_Element(this.children[0],")",this,true)
        )
        this.prio = 1
    }

    operate(child_results){
        return Math.log(child_results[1]) / Math.log(child_results[0])
    }
}

class Container_Element extends Math_Element{
    constructor(left,value,parent,last_container){
        if(last_container){
            super("container",left,value,["additive_operation","multi_operation"])
        }else{
            super("container",left,value,["additive_operation","brackets_operation","int","ans"])
        }
        this.prio = 1
        this.parent = parent
    }
}

class Sin_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sin(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return Math.sin(val/360*(2*Math.PI))
    }
}

class Cos_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cos(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return Math.cos(val/360*(2*Math.PI))
    }
}

class Tan_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tan(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return Math.tan(val/360*(2*Math.PI))
    }
}

class Log_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"log(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return Math.log10(val)
    }
}

class Ln_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"ln(",["additive_operation","container_operation","brackets_operation","int","ans"])
        this.prio = 1
    }

    operate(val){
        return Math.log(val)
    }
}

class Ans_Element extends Math_Element{
    constructor(left){
        super("ans",left,"Ans",["additive_operation","multi_operation"])
    }
}

class InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element) {
        this.display_input_element = display_input_element;
        this.display_output_element = display_output_element;
        this.math_input_element = math_input_element;
        this.math_output_element = math_output_element;
    }

    identify_period(number) {
        const number_as_string = number.toString();
        const places_till_decimal = number_as_string.indexOf(".")

        let possible_periods = []

        for(let decimal_index = number_as_string.length - 1; decimal_index > places_till_decimal; decimal_index--){
            let this_char = number_as_string[decimal_index]

            if(possible_periods.length == 0){
                possible_periods = [{string:this_char,index:0,repeats:1,ended:false}]
            }else{
                for(let period_index in possible_periods){
                    let period = possible_periods[period_index]
                    if(period.ended){
                        continue
                    }

                    if(this_char == period.string[period.index]){
                        period.index--
                        if(period.index < 0){
                            period.repeats++
                            period.index = period.string.length - 1
                        }
                    }else{
                        period.ended = true
                    }
                }

                possible_periods.push({string:number_as_string.substring(decimal_index),index:number_as_string.length - decimal_index - 1,repeats:1,ended:false})
            }
        }

        let best_period_index = -1
        let most_digits_repeated = 0
        let shortest_period_string_length = Infinity

        for(let period_index in possible_periods){
            let period = possible_periods[period_index]
            let repeated_digits = period.repeats * period.string.length + period.string.length - period.index - 1
            let period_string_length = period.string.length

            if(repeated_digits >= 9 + period_string_length && (repeated_digits > most_digits_repeated || (repeated_digits == most_digits_repeated && period_string_length < shortest_period_string_length))){
                best_period_index = period_index
                most_digits_repeated = repeated_digits
                shortest_period_string_length = period_string_length
            }
        }

        if(best_period_index == -1){
            return [number,false]
        }else{
            let best_period = possible_periods[best_period_index]
            let shifted_period = best_period.string.substring(best_period.index + 1) + best_period.string.substring(0,best_period.index + 1)
            let period_begin = number_as_string.length - most_digits_repeated
            let num_without_period = number_as_string.substring(0,period_begin)

            return [num_without_period,shifted_period]
        }
    }

    round_to_significant_places(num,places){
        const digitsBeforeDecimal = Math.max(0,Math.floor(Math.log10(Math.abs(num))) + 1);

        // If there are fewer than 10 digits before the decimal point, scale up
        const scaleFactor = Math.pow(10, places - digitsBeforeDecimal);
        
        // Round the number to the required precision
        const rounded = Math.round(num * scaleFactor) / scaleFactor
        const decimalPart = rounded.toString().split('.')[1];
        const decimalPlaces = decimalPart ? decimalPart.length : 0;

        return [rounded,digitsBeforeDecimal,decimalPlaces];
    }

    parse_continued_fraction(continued_fraction){
        let res = [1,0]
        for(let level = continued_fraction.length - 1; level >= 0; level--){
            res = [continued_fraction[level] * res[0] + res[1],res[0]]
        }
        return res
    }

    fraction_to_decimal(fraction){
        return fraction[0] / fraction[1]
    }

    decimal_to_continued_fraction(decimal,epsilon=1e-12){
        let new_decimal = decimal
        let this_int = Math.floor(new_decimal)
        let res = [this_int]
        let remainder = new_decimal - this_int
        let resulting_fraction = this.parse_continued_fraction(res)

        while(Math.abs(this.fraction_to_decimal(resulting_fraction) - decimal) > epsilon){
            new_decimal = 1 / remainder
            this_int = Math.floor(new_decimal)
            res.push(this_int)
            remainder = new_decimal - this_int
            resulting_fraction = this.parse_continued_fraction(res)
        }

        return [res,resulting_fraction]
    }

    formatNumber(num,as_fraction=true) {
        let res_num;
        if(typeof num == "string"){
            return num
        }
        // Convert to scientific notation if there are 10 or more significant digits
        if (Math.abs(num) >= 1e10 || (num !== 0 && Math.abs(num) < 1e-10)) {
            return num.toExponential(9); // Adjust precision as needed
        }else{
            if(as_fraction){
                let resulting_fraction = this.decimal_to_continued_fraction(num)[1]
                let resulting_fraction_length = (resulting_fraction[0].toString() + resulting_fraction[1].toString()).length

                if(resulting_fraction[1] != 1 && resulting_fraction_length <= 9){
                    return "<span class='frac_wrapper'><span class='frac_top'>" + resulting_fraction[0] + "</span><span class='frac_bottom'>" + resulting_fraction[1] + "</span></span>"
                }
            }

            res_num = this.round_to_significant_places(num,10)[0]
        }
        return res_num.toString();
    }

    vertical_align_elements() {
        // Step 1: Collect all the elements
        let alignRightElements = [...document.querySelectorAll('[class*="alignRight"]')];

        // Step 2: Sort them based on the 'align_id' in descending order
        alignRightElements.sort((a, b) => {
            const aId = a.className.match(/alignRight(\d+)/)[1];
            const bId = b.className.match(/alignRight(\d+)/)[1];
            return bId - aId;  // Sorting in descending order
        });

        // Step 3: Process each element after sorting
        alignRightElements.forEach(el => {
            let align_id = el.className.match(/alignRight(\d+)/)[1];
            let align_left_el = document.getElementsByClassName("alignLeft" + align_id)[0];
            let align_left_rect = align_left_el.getBoundingClientRect()

            let right_y = el.getBoundingClientRect().top;
            let left_y = align_left_rect.top + align_left_rect.height / 2;

            let y_shift = right_y - left_y;

            el.parentElement.style.verticalAlign = `calc(${y_shift}px + 0.06rem)`;
        });
        
        /*const elements_to_align = document.querySelectorAll(".align")

        for(let element_index = 0; element_index < elements_to_align.length; element_index++){
            let this_element = elements_to_align[element_index]
            let parent_element = this_element.parentElement
            
            let align_y = this_element.getBoundingClientRect().top
            let parent_bottom = parent_element.getBoundingClientRect().bottom
            let parent_height = parent_element.getBoundingClientRect().height

            let vertical_align = 0.5 * parent_height - (parent_bottom - align_y)

            //parent_element.style.verticalAlign = `calc(${vertical_align}px - 0.25rem)`
        }*/
    }
}

class EquationInputHandler extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler) {
        super(display_input_element, math_input_element, display_output_element, math_output_element)
        this.input_code_history = [];
        this.parent_handler = parent_handler
        this.padding_top = 0
    }

    // Method to handle input
    handle(input_code) {
        if(input_code == "key_ac"){
            this.input_code_history = []
        }else{
            this.input_code_history.push(input_code);
        }
        this.update_display(true);
        this.update_position()
    }

    update_display(show_cursor) {
        let parse_res = this.parse_input_code_history(this.input_code_history,show_cursor);
        if(parse_res){
            let [input_string, output_number] = parse_res
            this.math_input_element.innerHTML = input_string
            this.math_output_element.innerHTML = this.formatNumber(output_number)

            this.vertical_align_elements()

            /*let cursor_y_top = document.getElementsByClassName("cursor")[0].getBoundingClientRect().top
            let input_display_top = this.math_input_element.getBoundingClientRect().top
            let top_overflow = input_display_top - cursor_y_top
            this.padding_top = Math.max(0,top_overflow)
            this.math_input_element.style.paddingTop = this.padding_top + "px"*/

            if(show_cursor){
                let cursor_x = document.getElementsByClassName("cursor")[0].getBoundingClientRect().right
                let scroll_border_x = document.querySelector('[inkscape\\3a label="scroll_x_border"]').getBoundingClientRect().left
                let x_dist_to_scroll_border = cursor_x - scroll_border_x

                let cursor_y_bot = document.getElementsByClassName("cursor")[0].getBoundingClientRect().bottom
                let scroll_border_y = document.querySelector('[inkscape\\3a label="scroll_y_border"]').getBoundingClientRect().top
                let y_dist_to_scroll_border = cursor_y_bot - scroll_border_y

                this.math_input_element.scrollBy(x_dist_to_scroll_border,y_dist_to_scroll_border)
            }
        }
    }

    update_position() {
        this.align_element(this.display_input_element, this.math_input_element);
        this.align_element(this.display_output_element, this.math_output_element);
    }

    align_element(displayElement, mathElement) {
        const rect = displayElement.getBoundingClientRect();
        mathElement.style.position = "absolute";
        mathElement.style.left = `${rect.left}px`;
        mathElement.style.top = `${rect.top}px`;
        mathElement.style.width = `${rect.width}px`;
        mathElement.style.height = `${Math.max(0,rect.height - this.padding_top)}px`;
    }

    math_elements_to_string(math_elements,last_cursor_element,show_cursor) {
        let res = ""
        let cursor_element = math_elements
        let placeholder_select = false

        while(cursor_element){
            switch(cursor_element.type){
                case "start":
                    break;

                case "container_operation":
                case "container":
                    if(
                        is_family(cursor_element,cursor_element.neighbors[2])
                    ){
                        res += cursor_element.value
                        if(show_cursor && cursor_element == last_cursor_element){
                            res += '<span class="cursor">\uE000</span>'
                            placeholder_select = true
                        }
                        res += "▯"
                        break;
                    }

                case "int":
                case "additive_operation":
                case "multi_operation":
                case "brackets_operation":
                case "brackets_close":
                case "ans":
                case "container_operation":
                case "container":
                    res += cursor_element.value
                    break;
            }
            if(show_cursor && cursor_element == last_cursor_element && !placeholder_select){
                res += '<span class="cursor">\uE000</span>'
            }
            cursor_element = cursor_element.neighbors[2]
        }

        res += '\u00A0'

        return res
    }

    calc_math_elements(current_element, last_operation_element, res=0) {
        if(!current_element){
            return [res,current_element]
        }else if(current_element.neighbors[2] && current_element.allowed_right_neighbor[0] != "*" && !current_element.allowed_right_neighbor.includes(current_element.neighbors[2].type)){
            return [NaN,undefined]
        }

        switch(current_element.type){
            case "int":
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],last_operation_element,res * 10 + current_element.value)
            break;

            case "ans":
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],last_operation_element,this.parent_handler.results[this.parent_handler.results.length - 1])
            break;

            case "start":
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],current_element)
                if(current_element){
                    return [NaN,undefined]
                }
            break;

            case "additive_operation":
            case "multi_operation":
                if(current_element.prio > last_operation_element.prio){
                    let start_res = 0
                    if(current_element.value == ","){
                        start_res++
                    }
                    let [sub_res,sub_current_element] = this.calc_math_elements(current_element.neighbors[2],current_element,start_res)
                    res = current_element.operate(res,sub_res)
                    const result = this.calc_math_elements(sub_current_element, last_operation_element, res);
                    [res, current_element] = result;
                }
            break;

            case "brackets_operation":
                // TODO machen das Klammern selber multiplizieren
                const result = this.calc_math_elements(current_element.neighbors[2],current_element,0);
                let [inside_res,bracket_close_element] = result;
                inside_res = current_element.operate(inside_res)
                if(!bracket_close_element){
                    return [NaN,undefined]
                }
                [res,current_element] = this.calc_math_elements(bracket_close_element.neighbors[2],last_operation_element,inside_res)
            break;

            case "container_operation":
                // TODO machen das Klammern selber multiplizieren
                const child_results = []
                let current_container = current_element
                for(let child_index = 0; child_index < current_element.children.length; child_index++){
                    let [child_result,next_container_element] = this.calc_math_elements(current_container.neighbors[2],current_container,0)
                    current_container = next_container_element
                    if(!current_container){
                        return [NaN,undefined]
                    }
                    child_results.push(child_result)
                }
                let container_operation_res = current_element.operate(child_results);
                current_element = current_container;
                
                [res,current_element] = this.calc_math_elements(current_element.neighbors[2],current_element,container_operation_res);
            break;
        }

        return [res,current_element]
    }

    parse_input_code_history(input_code_history,show_cursor) {
        let res = new Start_Element()
        let cursor_element = res
        let calc_output = false

        for (const input_index in input_code_history) {
            let input_code = input_code_history[input_index]
            let old_cursor_element = cursor_element
            let old_right_neighbour = old_cursor_element.neighbors[2]
            let new_element;

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
                    new_element = new Int_Element(cursor_element,input_code.substring(4))
                    cursor_element = new_element
                break;

                case "key_dir1":
                case "key_dir3":
                    if(cursor_element.type == "start" && !cursor_element.neighbors[2]){
                        active_input_handler = this.parent_handler
                        this.parent_handler.equations.pop(1)
                        this.parent_handler.display_equation_index = (input_code == "key_dir1" ? 0 : this.parent_handler.equations.length - 1)
                        this.parent_handler.update_display()
                        return undefined
                    }
                    var dir = input_code.substring(7)
                    if(cursor_element.neighbors[dir]){
                        cursor_element = cursor_element.neighbors[dir]
                    }
                break;

                case "key_dir0":
                case "key_dir2":
                    var dir = input_code.substring(7)
                    if(cursor_element.neighbors[dir]){
                        cursor_element = cursor_element.neighbors[dir]
                    }else{
                        dir = (parseInt(dir) + 2) % 4
                        while(cursor_element.neighbors[dir]){
                            cursor_element = cursor_element.neighbors[dir]
                        }
                    }
                break;
                
                case "pos1":
                case "end":
                    var dir = (input_code == "pos1" ? 0 : 2)
                    while(cursor_element.neighbors[dir]){
                        cursor_element = cursor_element.neighbors[dir]
                    }
                break;
                
                case "key_Ans":
                    new_element = new Ans_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_=":
                    if(cursor_element.type != "start" || cursor_element.neighbors[2]){
                        calc_output = true
                    }
                    break;
                
                case "key_comma":
                    new_element = new Point_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_x":
                    new_element = new Times_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_÷":
                    new_element = new Div_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_+":
                    new_element = new Plus_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_-":
                    new_element = new Minus_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_(":
                    new_element = new Brackets_Element(cursor_element)
                    cursor_element = new_element
                    break;
                
                case "key_)":
                    new_element = new Brackets_Close_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_sin":
                    new_element = new Sin_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_cos":
                    new_element = new Cos_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_tan":
                    new_element = new Tan_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_log":
                    new_element = new Log_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_ln":
                    new_element = new Ln_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_frac":
                    new_element = new Frac_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_sqrt":
                    new_element = new Sqrt_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_pown":
                    new_element = new Pow_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_pow2":
                    new_element = new Pow_Element(cursor_element)
                    cursor_element = new_element
                    var prefilled_element = new Int_Element(cursor_element.children[0],2)
                    prefilled_element.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element
                    break;

                case "key_pow-1":
                    new_element = new Pow_Element(cursor_element)
                    cursor_element = new_element
                    var prefilled_element1 = new Minus_Element(cursor_element.children[0])
                    var prefilled_element2 = new Int_Element(prefilled_element1,1)
                    prefilled_element2.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element2
                    break;

                case "key_logn":
                    new_element = new Logn_Element(cursor_element)
                    cursor_element = new_element
                    break;

                case "key_del":
                    switch(cursor_element.type){
                        case "start":
                            break;

                        case "container":
                            cursor_element = cursor_element.neighbors[0]
                            break;
                        
                        case "container_operation":
                            let elements_to_delete = [cursor_element].concat(cursor_element.children)
                            cursor_element = cursor_element.neighbors[0]
                            for(let delete_index = 0; delete_index < elements_to_delete.length; delete_index++){
                                let element_to_delete = elements_to_delete[delete_index]
                                element_to_delete.neighbors[0].neighbors[2] = element_to_delete.neighbors[2]
                                if(element_to_delete.neighbors[0].neighbors[2]){
                                    element_to_delete.neighbors[0].neighbors[2].neighbors[0] = element_to_delete.neighbors[0]
                                }
                            }
                            break;

                        default:
                            cursor_element = cursor_element.neighbors[0]
                            cursor_element.neighbors[2] = old_cursor_element.neighbors[2]
                            if(cursor_element.neighbors[2]){
                                cursor_element.neighbors[2].neighbors[0] = cursor_element
                            }
                    }
                    break;
            }

            if(new_element){
                if(old_right_neighbour){
                    if(new_element.children){
                        let last_child = new_element.children[new_element.children.length - 1]
                        last_child.neighbors[2] = old_right_neighbour
                        old_right_neighbour.neighbors[0] = last_child
                    }else{
                        new_element.neighbors[2] = old_right_neighbour
                        old_right_neighbour.neighbors[0] = new_element
                    }
                }
                if(!new_element.neighbors[1]){
                    new_element.neighbors[1] = old_cursor_element.neighbors[1]
                }
                if(!new_element.neighbors[3]){
                    new_element.neighbors[3] = old_cursor_element.neighbors[3]
                }
            }
        }

        if(calc_output){
            let this_result = this.calc_math_elements(res)[0]
            if(isNaN(this_result)){
                this.input_code_history.pop()
                return [
                    "syntaxfehler",
                    ""
                ]
            }else{
                active_input_handler = this.parent_handler
                this.parent_handler.input_strings[this.parent_handler.display_equation_index] = this.math_elements_to_string(res,cursor_element,false)
                this.parent_handler.results[this.parent_handler.display_equation_index] = this_result
                this.parent_handler.update_display(false)
                this.parent_handler.update_position()
                return undefined
            }
        }else{
            return [
                this.math_elements_to_string(res,cursor_element,show_cursor),
                ""
            ]
        }
    }
}

class EquationSelectInputHandler extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element) {
        super(display_input_element, math_input_element, display_output_element, math_output_element)
        this.equations = []
        this.add_empty_equation()
        this.display_equation_index = 0
        this.max_equations = 15
        this.ans_value = 0
        this.input_strings = []
        this.results = []
        this.as_fraction = true

        active_input_handler = this.equations[this.display_equation_index]
    }

    add_empty_equation(){
        this.equations.push(new EquationInputHandler(this.display_input_element, this.math_input_element, this.display_output_element, this.math_output_element, this))
        this.as_fraction = true
    }

    select_equation(up){
        let index_before = this.display_equation_index
        if(up){
            this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index - 1, this.equations.length - 1) )
        }else{
            this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index + 1, this.equations.length - 1) )
        }
        if(index_before != this.display_equation_index){
            this.as_fraction = true
        }
    }

    // Method to handle input
    handle(input_code) {
        switch(input_code){
            case "key_=":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history
                this.display_equation_index = this.equations.length - 1
                active_input_handler = this.equations[this.display_equation_index]
                active_input_handler.update_display()
                active_input_handler.update_position();
            break;

            case "key_dir0":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history.slice(0, -1)
                this.display_equation_index = this.equations.length - 1
                active_input_handler = this.equations[this.display_equation_index]
                active_input_handler.handle("end")
                active_input_handler.update_position();
            break;

            case "key_dir2":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history.slice(0, -1)
                this.display_equation_index = this.equations.length - 1
                active_input_handler = this.equations[this.display_equation_index]
                active_input_handler.handle("pos1")
                active_input_handler.update_position();
            break;

            case "key_SD":
                this.as_fraction = !this.as_fraction
                this.update_display();
            break;

            case "key_dir1":
                this.select_equation(false)
                this.update_position();
                this.update_display();
            break;

            case "key_dir3":
                this.select_equation(true)
                this.update_position();
                this.update_display();
            break;

            default:
                this.add_empty_equation()
                this.display_equation_index = this.equations.length - 1
                active_input_handler = this.equations[this.display_equation_index]
                active_input_handler.handle(input_code)
                active_input_handler.update_position();
            break;
        }
    }

    update_display() {
        if(this.equations.length > 0){
            this.math_input_element.innerHTML = this.input_strings[this.display_equation_index]
            this.math_output_element.innerHTML = this.formatNumber(this.results[this.display_equation_index],this.as_fraction)
            this.math_input_element.scroll(0,0)
            this.vertical_align_elements()
        }
    }

    update_position() {
        this.align_element(this.display_input_element, this.math_input_element);
        this.align_element(this.display_output_element, this.math_output_element);
    }

    align_element(displayElement, mathElement, align) {
        const rect = displayElement.getBoundingClientRect();
        mathElement.style.position = "absolute";
        mathElement.style.left = `${rect.left}px`;
        mathElement.style.top = `${rect.top}px`;
        mathElement.style.width = `${rect.width}px`;
        mathElement.style.height = `${rect.height}px`;
    }
}

function setRootFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
}

function handle_resize(){
    setRootFontSize(document.getElementById("layer1").getBoundingClientRect().height * 0.034506)
    active_input_handler.update_position()
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

            new EquationSelectInputHandler(
                document.querySelector('[inkscape\\3a label="display_input"]'),
                document.getElementById("math-input"),
                document.querySelector('[inkscape\\3a label="display_output"]'),
                document.getElementById("math-output")
            );
            handle_resize()
            attachEventListeners();
        })
        .catch(error => console.error("Error loading SVG:", error));

    function attachEventListeners() {
        const keyElements = document.querySelectorAll('[inkscape\\3a label^="key_"]');

        keyElements.forEach(element => {
            element.addEventListener("pointerdown", function () {
                this.classList.add("pressed");
                setTimeout(() => this.classList.remove("pressed"), 150);
            
                active_input_handler.handle(this.getAttribute('inkscape:label'));
            });
        });
        window.addEventListener('resize', handle_resize)
    }
});
