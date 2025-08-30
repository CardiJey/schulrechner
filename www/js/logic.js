function import_custom_math(math_engine){
    math_engine.import({
        sind: function(input){
            return math_engine.sin(math_engine.pi/180*input)
        },
        cosd: function(input){
            return math_engine.cos(math_engine.pi/180*input)
        },
        tand: function(input){
            return math_engine.tan(math_engine.pi/180*input)
        }
    })
}

function getDecimalSeparator(userLang) {
    const numberWithDecimal = 1.1;
    const formatted = new Intl.NumberFormat(userLang, {
        useGrouping: false
    }).format(numberWithDecimal);
    return formatted.replace(/\d/g, '')[0]; // entfernt alle Ziffern, übrig bleibt das Trennzeichen
}

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

function get_left_block(left){
    let next_left_neighbor = left
    let last_element;
    let first_element;
    let bracket_counter = 0

    if(next_left_neighbor.type == "brackets_operation"){
        bracket_counter -= 1
    }else if(next_left_neighbor.type == "brackets_close"){
        bracket_counter += 1
    }

    while(
        next_left_neighbor.type != "start" && 
        bracket_counter >= 0 &&
        (
            !["additive_operation","multi_operation","sto"].includes(next_left_neighbor.type) ||
            bracket_counter > 0
        )
    ){
        if(!first_element){
            first_element = next_left_neighbor
        }
        if(next_left_neighbor.type == "container"){
            if(next_left_neighbor.last_container){
                next_left_neighbor = next_left_neighbor.parent
            }else{
                break;
            }
        }else if(next_left_neighbor.type == "container_operation"){
            break;
        }
        last_element = next_left_neighbor
        next_left_neighbor = next_left_neighbor.neighbors[0]

        if(next_left_neighbor.type == "brackets_operation"){
            bracket_counter -= 1
        }else if(next_left_neighbor.type == "brackets_close"){
            bracket_counter += 1
        }
    }
    
    return [next_left_neighbor,last_element,first_element]
}

class Math_Element {
    constructor(type,left,value,mathjs_value) {
        this.type = type
        if(left){
            this.neighbors = [left,undefined,left.neighbors[2],undefined] //left,bottom,right,top
            left.neighbors[2] = this
        }else{
            this.neighbors = [left,undefined,undefined,undefined] //left,bottom,right,top
        }
        this.value = value
        this.mathjs_value = mathjs_value
    }

    set_neighbor(dir,neighbor){
        this.neighbors[dir] = neighbor
    }

    set_container_neighbors(neighbors){
        for (let dir = 1; dir <= 3; dir = dir + 2){
            let neighbor = neighbors[dir]
            if(neighbor){
                let element = this
                while(element != this.children[this.children.length - 1].neighbors[2]){
                    if(!element.neighbors[dir]){
                        element.neighbors[dir] = neighbor
                    }
                    element = element.neighbors[2]
                }
            }
        }
    }
}

class Start_Element extends Math_Element{
    constructor(){
        super("start",undefined,NaN,"")
        this.prio = 0
    }
}

class Int_Element extends Math_Element{
    constructor(left,value){
        super("int",left,parseInt(value),value)
    }
}

class Sto_Element extends Math_Element{
    constructor(left,var_name,global_logic_vars){
        super("sto",left,"→"+var_name,"")
        this.var_name = var_name
        this.global_logic_vars = global_logic_vars
    }

    operate(val){
        this.global_logic_vars.active_input_handler.parent_handler.user_var[this.var_name] = val
        return val
    }
}

class Memory_Element extends Math_Element{
    constructor(left,sign,global_logic_vars){
        super("sto",left,"M" + sign,"")
        this.var_name = "M"
        if(sign == "-"){
            this.sign = -1
        }else{
            this.sign = 1
        }
        this.global_logic_vars = global_logic_vars
    }

    operate(val){
        this.global_logic_vars.active_input_handler.parent_handler.user_var[this.var_name] += this.sign * val
        return val
    }
}

class Plus_Element extends Math_Element{
    constructor(left){
        super("additive_operation",left,"+","+")
    }
}

class Minus_Element extends Math_Element{
    constructor(left){
        super("additive_operation",left,"-","-")
    }
}

class Times_Element extends Math_Element{
    constructor(left){
        super("multi_operation",left,"×","*")
    }
}

class Div_Element extends Math_Element{
    constructor(left){
        super("multi_operation",left,"÷","/")
    }
}

class Point_Element extends Math_Element{
    constructor(left,userLang){
        super("point_operation",left,getDecimalSeparator(userLang),".")
    }
}

class Pow10_Element extends Math_Element{
    constructor(left){
        super("point_operation",left,"<span class='pow10'>×⒑</span>","*10^")
    }
}

class Brackets_Element extends Math_Element{
    constructor(left,value){
        super("brackets_operation",left,"(","(")
    }
}

class Brackets_Close_Element extends Math_Element{
    constructor(left,value){
        super("brackets_close",left,")",")")
    }
}

class Frac_Element extends Math_Element{
    constructor(left,global_logic_vars){
        let [next_left_neighbor,last_element,first_element] = get_left_block(left)
        
        let align_id = global_logic_vars.next_align_id
        global_logic_vars.next_align_id++
        super("container_operation",next_left_neighbor,"<span class='alignLeft" + align_id + "'></span><span class='frac_wrapper'><span class='frac_top'>","([")
        this.global_logic_vars = global_logic_vars
        if(last_element){
            last_element.neighbors[0] = this

            this.children = [
                new Container_Element(first_element,"</span><span class='frac_bottom alignRight" + align_id + "'>","][1]/[",this,false)
            ]

            let block_elements = []
            let element = first_element
            while(element != last_element.neighbors[0]){
                block_elements.push(element)
                element = element.neighbors[0]
            }
            element = first_element
            while(element != last_element.neighbors[0]){
                if(!element.neighbors[1] || !block_elements.includes(element.neighbors[1])){
                    element.neighbors[1] = this.children[0]
                }
                element = element.neighbors[0]
            }
        }else{
            this.children = [
                new Container_Element(this,"</span><span class='frac_bottom alignRight" + align_id + "'>","][1]/[",this,false)
            ]
        }
        
        this.children.push(
            new Container_Element(this.children[0],"</span></span>","][1])",this,true)
        )
        this.neighbors[1] = this.children[0]
        this.children[0].neighbors[3] = this.children[0]

        if(last_element){
            this.skip_to_element_after_creation = this.children[0]
        }
    }
}

class Sqrt_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"<span class='sqrt_wrapper'><span class='scale_height'>√</span><span class='sqrt'>","([")
        this.children = [
            new Container_Element(this,"</span></span>","][1]^0.5)",this,true)
        ]
    }
}

class Sqrtn_Element extends Math_Element{
    constructor(left,global_logic_vars){
        let subres_id = global_logic_vars.next_subres_id
        global_logic_vars.next_subres_id++
        super("container_operation",left,"<span class='pow_top'>","subres" + subres_id + "idstart")
        this.global_logic_vars = global_logic_vars
        this.children = [
            new Container_Element(this,"</span><span class='sqrt_wrapper'><span class='scale_height'>√</span><span class='sqrt'>","subres" + subres_id + "idend([",this,false)
        ]
        
        this.children.push(
            new Container_Element(this.children[0],"</span></span>","][1]^(1/[subres" + subres_id + "idinsert][1]))",this,true)
        )
    }
}


class Faculty_Element extends Math_Element{
    constructor(left){
        super("point_operation",left,"!","!")
    }
}

class Pow_Element extends Math_Element{
    constructor(left,is_exp_prefilled){
        let [next_left_neighbor,last_element,first_element] = get_left_block(left)

        super("container_operation",next_left_neighbor,"<span class='pow_bottom'>(","([")
        if(last_element){
            last_element.neighbors[0] = this

            this.children = [
                new Container_Element(first_element,")</span><span class='pow_top'>","][1]^[",this,false)
            ]
        }else{
            this.children = [
                new Container_Element(this,")</span><span class='pow_top'>","][1]^[",this,false)
            ]
        }
                        
        this.children.push(
            new Container_Element(this.children[0],"</span>","][1])",this,true)
        )
        this.is_exp_prefilled = is_exp_prefilled

        if(last_element){
            if(this.is_exp_prefilled){
                this.skip_to_element_after_creation = this.children[1]
            }else{
                this.skip_to_element_after_creation = this.children[0]
            }
        }
    }
}
class Logx_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"log<span class='logn_bottom'>","(1/log([")
        
        this.children = [
            new Container_Element(this,"</span>(","][1])*log([",this,false)
        ]
        this.children.push(
            new Container_Element(this.children[0],")","][1]))",this,true)
        )
    }
}

class Cmplx_i_Element extends Math_Element{
    constructor(left){
        super("var",left,"i","")
    }

    get_value(){
        return "i"
    }
}

class Container_Element extends Math_Element{
    constructor(left,value,mathjs_value,parent,last_container){
        super("container",left,value,mathjs_value)
        this.parent = parent
        this.last_container = last_container
    }

    set_neighbor(dir,neighbor){
        if(!this.last_container){
            let next_element = this.neighbors[2]
            while(!is_family(next_element,this)){
                if(!next_element.neighbors[dir]){
                    next_element.neighbors[dir] = neighbor
                }
            }
        }
        super.set_neighbor(dir,neighbor)
    }
}

class Sin_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sin(","sind(")
    }
}

class Cos_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cos(","cosd(")
    }
}

class Tan_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tan(","tand(")
    }
}

class ASin_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sin<span class='pow_top'>-1</span>(","180/PI*asin(")
    }
}

class ACos_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cos<span class='pow_top'>-1</span>(","180/PI*acos(")
    }
}

class ATan_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tan<span class='pow_top'>-1</span>(","180/PI*atan(")
    }
}

class Sinh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sinh(","sinh(")
    }
}

class Cosh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cosh(","cosh(")
    }
}

class Tanh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tanh(","tanh(")
    }
}

class ASinh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sinh<span class='pow_top'>-1</span>(","asinh(")
    }
}

class ACosh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cosh<span class='pow_top'>-1</span>(","acosh(")
    }
}

class ATanh_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tanh<span class='pow_top'>-1</span>(","atanh(")
    }
}

class Log_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"log(","log10(")
    }
}

class Ln_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"ln(","log(")
    }
}

class Ans_Element extends Math_Element{
    constructor(left,global_logic_vars){
        super("var",left,"Ans","")
        this.global_logic_vars = global_logic_vars
    }

    get_value(){
        return this.global_logic_vars.active_input_handler.parent_handler.results[this.global_logic_vars.active_input_handler.parent_handler.results.length - 1]
    }
}

class User_Var_Element extends Math_Element{
    constructor(left,var_name,global_logic_vars){
        super("var",left,var_name,"")
        this.var_name = var_name
        this.global_logic_vars = global_logic_vars
    }

    get_value(){
        if(this.global_logic_vars.active_input_handler.parent_handler.user_var[this.var_name]){
            return this.global_logic_vars.active_input_handler.parent_handler.user_var[this.var_name]
        }else{
            return 0
        }
    }
}

class Const_Element extends Math_Element{
    constructor(left,index){
        const char_map = [
            "mP",
            "mn",
            "me",
            "m<i>μ</i>",
            "aO",
            "h",
            "<i>μ</i>N",
            "<i>μ</i>B",
            "ħ",
            "<i>α</i>",
            "re",
            "λc",
            "γP",
            "λCP",
            "λCN",
            "R∞",
            "u",
            "<i>μ</i>P",
            "<i>μ</i>e",
            "<i>μ</i>n",
            "<i>μμ</i>",
            "F",
            "e",
            "NA",
            "k",
            "Vm",
            "R",
            "C0",
            "C1",
            "C2",
            "<i>σ</i>",
            "<i>ε</i>0",
            "<i>μ</i>0",
            "<i>Φ</i>0",
            "g",
            "G0",
            "Z0",
            "t",
            "G",
            "atm",
            "<i>π</i>",
            "<i>e</i>",
        ]
        super("var",left,char_map[index],"")
        this.index = index
    }

    get_value(){
        const value_map = [
            1.672621637e-27,//1
            1.674927211e-27,//2
            9.10938215e-31,//3
            1.8835313e-28,//4
            5.291772086e-11,//5
            6.62606896e-34,//6
            5.05078324e-27,//7
            9.27400915e-24,//8
            1.054571628e-34,//9
            7.297352538e-3,//10
            2.817940289e-15,//11
            2.426310218e-12,//12
            267522209.9,//13
            1.321409845e-15,//14
            1.319590895e-15,//15
            10973731.57,//16
            1.660538782e-27,//17
            1.410606662e-26,//18
            -9.28476377e-24,//19
            -9.6623641e-27,//20
            -4.49044786e-26,//21
            96485.3399,//22
            1.602176487e-19,//23
            6.02214179e23,//24
            1.3806504e-23,//25
            0.022413996,//26
            8.314472,//27
            299792458,//28
            3.74177118e-16,//29
            0.014387752,//30
            5.6704e-8,//31
            8.854187817e-12,//32
            1.256637061e-6,//33
            2.067833667e-15,//34
            9.80665,//35
            7.7480917e-5,//36
            376.7303134,//37
            273.15,//38
            6.67428e-11,//39
            101325,//40
            Math.PI,//41
            Math.E//42
        ]

        return value_map[this.index]
    }
}

class InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang) {
        this.display_input_element = display_input_element;
        this.display_output_element = display_output_element;
        this.math_input_element = math_input_element;
        this.math_output_element = math_output_element;
        this.global_logic_vars = global_logic_vars;
        this.ui = ui
        this.userLang = userLang
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

    decimal_to_continued_fraction(decimal,epsilon=1e-16){
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
        if(typeof num == "string"){
            return num
        }
        if(typeof num == "object"){
            let re_string = this.formatNumber(num.re)
            let im_string = this.formatNumber(num.im)
            let res_string = ""
            if(re_string != "0"){
                res_string += re_string
            }
            if(im_string != "0"){
                if(re_string != "0"){
                    res_string += "+"
                }
                if(im_string != "1"){
                    res_string += im_string
                }
                res_string += "i"
            }
            if(res_string != ""){
                return res_string
            }else{
                return "0"
            }
        }
        
        if(as_fraction){
            let resulting_fraction = this.decimal_to_continued_fraction(num)[1]
            let resulting_fraction_length = (resulting_fraction[0].toString() + resulting_fraction[1].toString()).length

            if(resulting_fraction[1] != 1 && resulting_fraction_length <= 9){
                return "<span class='frac_wrapper'><span class='frac_top'>" + resulting_fraction[0] + "</span><span class='frac_bottom'>" + resulting_fraction[1] + "</span></span>"
            }
        }

        if (Math.abs(num) >= 1e10 || (num !== 0 && Math.abs(num) < 1e-2)) {
            let [coeff, exp] = num.toExponential(9).split('e');
            if(exp.startsWith('+')){
                exp = exp.substring(1)
            }
            return new Intl.NumberFormat(this.userLang, {
                useGrouping: false,
                maximumSignificantDigits: 10
            }).format(parseFloat(coeff)) + "<span class='pow10'>×⒑</span><span class='pow_top'>" + exp + "</span>"
        }

        return new Intl.NumberFormat(this.userLang, {
            useGrouping: false,
            maximumSignificantDigits: 10
        }).format(num)
    }
}

class SelectInput extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang, max_input){
        super(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang)
        this.numbers = []
        this.parent_handler = parent_handler
        this.max_input = max_input
    }

    // Method to handle input
    handle(input_code) {
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
                    let number = input_code.substring(4)
                    let input_allowed = true
                    this.numbers.push(number)
                    for(let i = 0; i < this.numbers.length; i++){
                        if(this.numbers[i] < this.max_input[i]){
                            break
                        }else if(this.numbers[i] > this.max_input[i]){
                            input_allowed = false
                            break
                        }
                    }
                    if(input_allowed){
                        let all_zero = true
                        for(let i = 0; i < this.numbers.length; i++){
                            if(this.numbers[i] != "0"){
                                all_zero = false
                            }
                        }
                        if(this.numbers.length >= this.max_input.length && all_zero){
                            input_allowed = false
                        }
                    }
                    if(!input_allowed){
                        this.numbers.pop()
                    }
                break;

                case "key_ac":
                    this.global_logic_vars.active_input_handler = this.parent_handler
                break;
        }
        if(this.numbers.length >= this.max_input.length){
            this.global_logic_vars.active_input_handler = this.parent_handler
            this.parent_handler.input_code_history.push(this.give_resulting_key())
        }
        this.global_logic_vars.active_input_handler.update_display(true);
        this.global_logic_vars.active_input_handler.update_position()
    }

    update_position() {
        this.ui.align_element(this.display_input_element, this.math_input_element);
        this.ui.align_element(this.display_output_element, this.math_output_element);
    }
}

class ConstSelectInput extends SelectInput{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang){
        super(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang, [4,0])
    }

    give_resulting_key(){
        return "key_CONST_" + this.numbers[0] + this.numbers[1]
    }

    update_display() {
        this.math_input_element.innerHTML = "KONSTANTE<br>Nummer 01~40?"
        let out_string = "["
        for(let i = 0; i < 2; i++){
            if(this.numbers.length > i){
                out_string += this.numbers[i]
            }else{
                out_string += "_"
            }
        }
        out_string += "]"
        this.math_output_element.innerHTML = out_string
        this.math_input_element.scroll(0,0)
        this.ui.vertical_align_elements()
    }
}

class HypSelectInput extends SelectInput{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang){
        super(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang, [6])
        this.hyp_keys = [
            "key_sinh",
            "key_cosh",
            "key_tanh",
            "key_asinh",
            "key_acosh",
            "key_atanh"
        ]
    }

    give_resulting_key(){
        return this.hyp_keys[parseInt(this.numbers[0])-1]
    }

    update_display() {
        let out_string = "1:sinh&nbsp;&nbsp;&nbsp;2:cosh<br>"
        out_string += "3:tanh&nbsp;&nbsp;&nbsp;4:sinh-1<br>"
        out_string += "5:cosh-1&nbsp;6:tanh-1"
        this.math_output_element.innerHTML = ""
        this.math_input_element.innerHTML = "<span class='frac_top'>" + out_string + "</span>"
        this.math_input_element.scroll(0,0)
        this.ui.vertical_align_elements()
    }
}

class ModeSelectInput extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang, max_input){
        super(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang)
        this.parent_handler = parent_handler
        this.calc_mode_map = {
            "key_1":"COMP",
            "key_2":"CMPLX",
        }
    }

    // Method to handle input
    handle(input_code) {
        if(input_code in this.calc_mode_map){
            this.ui.set_calc_mode(this.calc_mode_map[input_code])
        }else if(["key_ac","key_mode"].indexOf(input_code) != -1){
            this.global_logic_vars.active_input_handler = this.parent_handler
        }
        this.global_logic_vars.active_input_handler.update_display(true);
        this.global_logic_vars.active_input_handler.update_position()
    }

    update_display() {
        let out_string = "1:COMP&nbsp;&nbsp;&nbsp;2:CMPLX<br>"
        //out_string += "3:tanh&nbsp;&nbsp;&nbsp;4:sinh-1<br>"
        //out_string += "5:cosh-1&nbsp;6:tanh-1"
        this.math_output_element.innerHTML = ""
        this.math_input_element.innerHTML = "<span class='frac_top'>" + out_string + "</span>"
        this.math_input_element.scroll(0,0)
        this.ui.vertical_align_elements()
    }

    update_position() {
        this.ui.align_element(this.display_input_element, this.math_input_element);
        this.ui.align_element(this.display_output_element, this.math_output_element);
    }
}

class EquationInputHandler extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, parent_handler, global_logic_vars, ui, userLang) {
        super(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang)
        this.input_code_history = [];
        this.parent_handler = parent_handler
        this.modes = {
            "shift": false,
            "alpha": false,
            "STO": false
        }
        this.mode_maps = global_logic_vars.mode_maps
    }

    toggle_mode(mode_to_toggle){
        for(let mode in this.modes){
            if(mode == mode_to_toggle){
                this.modes[mode] = !this.modes[mode]
            }else{
                this.modes[mode] = false
            }
        }

        this.ui.toggle_indicators(this.modes)
    }

    // Method to handle input
    handle(input_code) {
        if(input_code == "key_ac"){
            this.input_code_history = []
            this.toggle_mode("none")
        }else if(input_code == "key_shift"){
            this.toggle_mode("shift")
        }else if(input_code == "key_alpha"){
            this.toggle_mode("alpha")
        }else{
            if(this.modes["shift"]){
                this.toggle_mode("none")
                let mapped_input_code = this.mode_maps["shift"][input_code]
                if(mapped_input_code){
                    if(mapped_input_code == "key_STO"){
                        this.toggle_mode("STO")
                    }else{
                        this.input_code_history.push(mapped_input_code);
                    }
                }
            }else if(this.modes["alpha"]){
                this.toggle_mode("none")
                if(this.mode_maps["alpha"][input_code]){
                    this.input_code_history.push(this.mode_maps["alpha"][input_code]);
                }
            }else if(this.modes["STO"]){
                this.toggle_mode("none")
                if(this.mode_maps["STO"][input_code]){
                    this.input_code_history.push(this.mode_maps["STO"][input_code]);
                }
            }else{
                this.input_code_history.push(input_code);
            }
            if([
                "key_STO_A",
                "key_STO_B",
                "key_STO_C",
                "key_STO_D",
                "key_STO_E",
                "key_STO_F",
                "key_STO_X",
                "key_STO_Y",
                "key_STO_M",
                "key_M+",
                "key_M-"
            ].includes(this.input_code_history[this.input_code_history.length - 1])){
                this.input_code_history.splice(this.input_code_history.length - 1,0,"end");
                this.input_code_history.push("key_=");
            }
            const last_input_code = this.input_code_history[this.input_code_history.length - 1]
            switch(last_input_code){
                case "key_CONST":
                    this.global_logic_vars.active_input_handler = new ConstSelectInput(
                        this.display_input_element,
                        this.math_input_element,
                        this.display_output_element,
                        this.math_output_element,
                        this,
                        this.global_logic_vars,
                        this.ui,
                        this.userLang
                    )
                    this.input_code_history.pop(2)
                break;

                case "key_hyp":
                    this.global_logic_vars.active_input_handler = new HypSelectInput(
                        this.display_input_element,
                        this.math_input_element,
                        this.display_output_element,
                        this.math_output_element,
                        this,
                        this.global_logic_vars,
                        this.ui,
                        this.userLang
                    )
                    this.input_code_history.pop(2)
                break;

                case "key_mode":
                    this.global_logic_vars.active_input_handler = new ModeSelectInput(
                        this.display_input_element,
                        this.math_input_element,
                        this.display_output_element,
                        this.math_output_element,
                        this,
                        this.global_logic_vars,
                        this.ui,
                        this.userLang
                    )
                    this.input_code_history.pop(2)
                break;
            }
        }
        this.global_logic_vars.active_input_handler.update_display(true);
        this.global_logic_vars.active_input_handler.update_position()
    }

    update_display(show_cursor) {
        let parse_res = this.parse_input_code_history(this.input_code_history,show_cursor);
        if(parse_res){
            let [input_string, output_number] = parse_res
            this.math_input_element.innerHTML = input_string
            this.math_output_element.innerHTML = this.formatNumber(output_number)

            this.ui.vertical_align_elements()

            if(show_cursor){
                this.ui.scroll_element(this.math_input_element)
            }
        }
    }

    update_position() {
        this.ui.align_element(this.display_input_element, this.math_input_element);
        this.ui.align_element(this.display_output_element, this.math_output_element);
    }

    handle_subres(mathjs_res){
        let found_subres = true
        while(found_subres){
            let subres_index = mathjs_res.indexOf("subres")
            if(subres_index == -1){
                found_subres = false
            }else{
                let substring_after_subres = mathjs_res.substring(subres_index + "subres".length)
                let id_end_index = substring_after_subres.indexOf("id")
                let this_subres_id = substring_after_subres.substring(0,id_end_index)

                let subres_start_indicator = "subres" + this_subres_id + "idstart"
                let subres_end_indicator = "subres" + this_subres_id + "idend"
                let subres_insert_indicator = "subres" + this_subres_id + "idinsert"

                let subres_start_index = mathjs_res.indexOf(subres_start_indicator)
                let subres_end_index = mathjs_res.indexOf(subres_end_indicator)
                let subres_insert_index = mathjs_res.indexOf(subres_insert_indicator)
                let subres = mathjs_res.substring(subres_start_index + subres_start_indicator.length,subres_end_index)
                mathjs_res = mathjs_res.substring(0,subres_insert_index) + subres + mathjs_res.substring(subres_insert_index + subres_insert_indicator.length)

                subres_start_index = mathjs_res.indexOf(subres_start_indicator)
                subres_end_index = mathjs_res.indexOf(subres_end_indicator)
                mathjs_res = mathjs_res.substring(0,subres_start_index) + mathjs_res.substring(subres_end_index + subres_end_indicator.length)
            }
        }
        return mathjs_res
    }

    math_elements_to_string(math_elements,last_cursor_element,show_cursor) {
        let res = ""
        let mathjs_res = ""
        let cursor_element = math_elements
        let placeholder_select = false
        let sto

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
                            res += "<span class='cursor'>\uE000</span>"
                            placeholder_select = true
                        }
                        res += "▯"
                        break;
                    }

                case "int":
                case "additive_operation":
                case "multi_operation":
                case "point_operation":
                case "sto":
                case "brackets_operation":
                case "brackets_close":
                case "var":
                case "container_operation":
                case "container":
                    res += cursor_element.value
                    break;
            }
            if(show_cursor && cursor_element == last_cursor_element && !placeholder_select){
                res += "<span class='cursor'>\uE000</span>"
            }
            if(sto){
                mathjs_res = "error"
                break
            }else{
                switch(cursor_element.type){
                    case "var":
                        mathjs_res += "(" + cursor_element.get_value() + ")"
                    break;
    
                    case "sto":
                        sto = cursor_element
                    break;
    
                    default:
                        mathjs_res += cursor_element.mathjs_value
                    break;
                }
            }
            cursor_element = cursor_element.neighbors[2]
        }

        res += '\u00A0'
        return [res,mathjs_res,sto]
    }

    parse_input_code_history(input_code_history,show_cursor) {
        let res = new Start_Element()
        let cursor_element = res
        let calc_output = false

        for (const input_index in input_code_history) {
            let input_code = input_code_history[input_index]
            let old_neighbors = [
                cursor_element.neighbors[0],
                cursor_element.neighbors[1],
                cursor_element.neighbors[2],
                cursor_element.neighbors[3]
            ]
            let new_elements = [];

            let input_code_for_switch = input_code
            if(input_code_for_switch.startsWith("key_CONST")){
                input_code_for_switch = "key_CONST"
            }

            switch(input_code_for_switch){
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
                    new_elements.push(new Int_Element(cursor_element,input_code.substring(4)))
                    cursor_element = new_elements[0]
                break;

                case "key_dir1":
                case "key_dir3":
                    if(cursor_element.type == "start" && !cursor_element.neighbors[2]){
                        this.global_logic_vars.active_input_handler = this.parent_handler
                        this.parent_handler.equations.pop(1)
                        this.parent_handler.display_equation_index = (input_code == "key_dir1" ? 0 : this.parent_handler.equations.length - 1)
                        this.parent_handler.update_display()
                        return undefined
                    }
                    var dir = input_code.substring(7)
                    if(cursor_element.neighbors[dir]){
                        cursor_element = cursor_element.neighbors[dir]
                        if(dir == 3){
                            cursor_element = cursor_element.neighbors[0]
                        }
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
                    new_elements.push(new Ans_Element(cursor_element,this.global_logic_vars))
                    cursor_element = new_elements[0]
                    break;

                case "key_uservar_A":
                case "key_uservar_B":
                case "key_uservar_C":
                case "key_uservar_D":
                case "key_uservar_E":
                case "key_uservar_F":
                case "key_uservar_X":
                case "key_uservar_Y":
                case "key_uservar_M":
                    new_elements.push(new User_Var_Element(cursor_element,input_code.substring(12),this.global_logic_vars))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_pi":
                    new_elements.push(new Const_Element(cursor_element,40))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_e":
                    new_elements.push(new Const_Element(cursor_element,41))
                    cursor_element = new_elements[0]
                    break;

                case "key_CONST":
                    new_elements.push(new Const_Element(cursor_element,parseInt(input_code.substring(10))-1))
                    cursor_element = new_elements[0]
                break;

                case "key_=":
                    if(cursor_element.type != "start" || cursor_element.neighbors[2]){
                        calc_output = true
                    }
                    break;

                case "key_STO_A":
                case "key_STO_B":
                case "key_STO_C":
                case "key_STO_D":
                case "key_STO_E":
                case "key_STO_F":
                case "key_STO_X":
                case "key_STO_Y":
                case "key_STO_M":
                case "key_M+":
                case "key_M-":
                    if(cursor_element.type != "start" || cursor_element.neighbors[2]){
                        while(cursor_element.neighbors[2]){
                            cursor_element = cursor_element.neighbors[2]
                        }
                        if(input_code.startsWith("key_STO")){
                            new_elements.push(new Sto_Element(cursor_element,input_code.substring(8),this.global_logic_vars))
                        }else if(input_code.startsWith("key_M")){
                            new_elements.push(new Memory_Element(cursor_element,input_code.substring(5),this.global_logic_vars))
                        }
                        cursor_element = new_elements[0]
                    }
                    break;
                
                case "key_comma":
                    new_elements.push(new Point_Element(cursor_element,this.userLang))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_pow10":
                    new_elements.push(new Pow10_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_x":
                    new_elements.push(new Times_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_÷":
                    new_elements.push(new Div_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_+":
                    new_elements.push(new Plus_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_-":
                case "key_(-)":
                    new_elements.push(new Minus_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_(":
                    new_elements.push(new Brackets_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_)":
                    new_elements.push(new Brackets_Close_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_sin":
                    new_elements.push(new Sin_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_cos":
                    new_elements.push(new Cos_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_tan":
                    new_elements.push(new Tan_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_sin-1":
                    new_elements.push(new ASin_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_cos-1":
                    new_elements.push(new ACos_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_tan-1":
                    new_elements.push(new ATan_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_sinh":
                    new_elements.push(new Sinh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_cosh":
                    new_elements.push(new Cosh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_tanh":
                    new_elements.push(new Tanh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;
                
                case "key_asinh":
                    new_elements.push(new ASinh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_acosh":
                    new_elements.push(new ACosh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_atanh":
                    new_elements.push(new ATanh_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_log":
                    new_elements.push(new Log_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_ln":
                    new_elements.push(new Ln_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_frac":
                    new_elements.push(new Frac_Element(cursor_element,this.global_logic_vars))
                    cursor_element = new_elements[0]
                    break;

                case "key_sqrt":
                    new_elements.push(new Sqrt_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_sqrtn":
                    new_elements.push(new Sqrtn_Element(cursor_element,this.global_logic_vars))
                    cursor_element = new_elements[0]
                    break;

                case "key_sqrt3":
                    var exponent = input_code.substring(8)
                    new_elements.push(new Sqrtn_Element(cursor_element,this.global_logic_vars))
                    cursor_element = new_elements[0].children[0]
                    var prefilled_element = new Int_Element(new_elements[0],exponent)
                    new_elements.push(prefilled_element)
                    prefilled_element.neighbors[2] = new_elements[0].children[0]
                    new_elements[0].children[0].neighbors[0] = prefilled_element
                    break;

                case "key_pown":
                    new_elements.push(new Pow_Element(cursor_element,false))
                    cursor_element = new_elements[0]
                    break;

                case "key_faculty":
                    new_elements.push(new Faculty_Element(cursor_element,false))
                    cursor_element = new_elements[0]
                    break;

                case "key_epow":
                    new_elements.push(new Pow_Element(cursor_element,true))
                    var prefilled_element = new Const_Element(new_elements[0],41)
                    new_elements.push(prefilled_element)
                    prefilled_element.neighbors[2] = new_elements[0].children[0]
                    new_elements[0].children[0].neighbors[0] = prefilled_element
                    cursor_element = new_elements[0].children[0]
                    break;

                case "key_pow2":
                case "key_pow3":
                    var exponent = input_code.substring(7)
                    new_elements.push(new Pow_Element(cursor_element,true))
                    cursor_element = new_elements[0]
                    var prefilled_element = new Int_Element(cursor_element.children[0],exponent)
                    new_elements.push(prefilled_element)
                    prefilled_element.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element
                    break;

                case "key_pow-1":
                    new_elements.push(new Pow_Element(cursor_element,true))
                    cursor_element = new_elements[0]
                    var prefilled_element1 = new Minus_Element(cursor_element.children[0])
                    var prefilled_element2 = new Int_Element(prefilled_element1,1)
                    new_elements.push(prefilled_element1,prefilled_element2)
                    prefilled_element2.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element2
                    break;

                case "key_logn":
                    new_elements.push(new Logx_Element(cursor_element))
                    cursor_element = new_elements[0]
                    break;

                case "key_i":
                    new_elements.push(new Cmplx_i_Element(cursor_element))
                    cursor_element = new_elements[0]
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
                            let element = elements_to_delete[elements_to_delete.length - 1]
                            while(element != elements_to_delete[0].neighbors[0]){
                                if(elements_to_delete.includes(element)){
                                    element.neighbors[0].neighbors[2] = element.neighbors[2]
                                    if(element.neighbors[0].neighbors[2]){
                                        element.neighbors[0].neighbors[2].neighbors[0] = element.neighbors[0]
                                    }
                                }else{
                                    if(elements_to_delete.includes(element.neighbors[1])){
                                        element.neighbors[1] = elements_to_delete[elements_to_delete.length - 1].neighbors[1]
                                    }

                                    if(elements_to_delete.includes(element.neighbors[3])){
                                        element.neighbors[3] = elements_to_delete[elements_to_delete.length - 1].neighbors[3]
                                    }
                                }
                                element = element.neighbors[0]
                            }
                            break;

                        default:
                            cursor_element = cursor_element.neighbors[0]
                            cursor_element.neighbors[2] = old_neighbors[2]
                            if(cursor_element.neighbors[2]){
                                cursor_element.neighbors[2].neighbors[0] = cursor_element
                            }
                    }
                    break;
            }

            if(new_elements.length > 0){
                if(new_elements[0].skip_to_element_after_creation){
                    cursor_element = new_elements[0].skip_to_element_after_creation
                }
                
                if(old_neighbors[2]){
                    if(new_elements[0].children){
                        let last_child = new_elements[0].children[new_elements[0].children.length - 1]
                        last_child.neighbors[2] = old_neighbors[2]
                        old_neighbors[2].neighbors[0] = last_child
                    }else{
                        new_elements[0].neighbors[2] = old_neighbors[2]
                        old_neighbors[2].neighbors[0] = new_elements[0]
                    }
                }
                for(let new_element_index = 0; new_element_index < new_elements.length; new_element_index++){
                    if(new_elements[new_element_index].type == "container_operation"){
                        new_elements[new_element_index].set_container_neighbors(old_neighbors)
                    }else{
                        if(!new_elements[new_element_index].neighbors[1]){
                            new_elements[new_element_index].set_neighbor(1,old_neighbors[1])
                        }
                        if(!new_elements[new_element_index].neighbors[3]){
                            new_elements[new_element_index].set_neighbor(3,old_neighbors[3])
                        }
                    }
                }
            }
        }

        if(calc_output){
            let [this_input_string,this_output_string,sto] = this.math_elements_to_string(res,cursor_element,false)
            this_output_string = this.handle_subres(this_output_string)
            let this_result
            try {
                this_result = this.global_logic_vars.math_engine.evaluate(this_output_string)
                if(
                    (typeof this_result != "number" || !isFinite(this_result)) && 
                    (this.global_logic_vars.calc_mode != "CMPLX" || typeof this_result != "object" || !"re" in this_result || !"im" in this_result) && 
                    typeof this_result != "string")
                {
                    throw "invalid"
                }
            } catch (error) {
                this_result = "error"
            }

            if(typeof this_result == "string"){
                this.input_code_history.pop()
                return [
                    this_result,
                    ""
                ]
            }else{
                if(sto){
                    sto.operate(this_result)
                }
                this.global_logic_vars.active_input_handler = this.parent_handler
                this.parent_handler.input_strings[this.parent_handler.display_equation_index] = this_input_string
                this.parent_handler.results[this.parent_handler.display_equation_index] = this_result
                this.parent_handler.update_display(false)
                this.parent_handler.update_position()
                return undefined
            }
        }else{
            return [
                this.math_elements_to_string(res,cursor_element,show_cursor)[0],
                ""
            ]
        }
    }
}

class CmplxEquationInputHandler extends EquationInputHandler{
    handle(input_code) {
        if(input_code in this.mode_maps.cmplx){
            super.handle(this.mode_maps.cmplx[input_code])
        }else{
            super.handle(input_code)
        }
    }
}

class EquationSelectInputHandler extends InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang) {
        super(display_input_element, math_input_element, display_output_element, math_output_element, global_logic_vars, ui, userLang)
        this.equations = []
        this.add_empty_equation()
        this.display_equation_index = 0
        this.max_equations = 15
        this.ans_value = 0
        this.input_strings = []
        this.results = []
        this.as_fraction = !this.global_logic_vars.prefer_decimals
        this.user_var = {
            "M":0
        }

        this.global_logic_vars.active_input_handler = this.equations[this.display_equation_index]
    }

    add_empty_equation(){
        if(this.global_logic_vars.calc_mode == "CMPLX"){
            this.equations.push(new CmplxEquationInputHandler(this.display_input_element, this.math_input_element, this.display_output_element, this.math_output_element, this, this.global_logic_vars, this.ui, this.userLang))
        }else{
            this.equations.push(new EquationInputHandler(this.display_input_element, this.math_input_element, this.display_output_element, this.math_output_element, this, this.global_logic_vars, this.ui, this.userLang))
        }
        this.as_fraction = !this.global_logic_vars.prefer_decimals
    }

    select_equation(up){
        let index_before = this.display_equation_index
        if(up){
            this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index - 1, this.equations.length - 1) )
        }else{
            this.display_equation_index = Math.max( 0, Math.min(this.display_equation_index + 1, this.equations.length - 1) )
        }
        if(index_before != this.display_equation_index){
            this.as_fraction = !this.global_logic_vars.prefer_decimals
        }
    }

    // Method to handle input
    handle(input_code) {
        switch(input_code){
            case "key_=":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history
                this.display_equation_index = this.equations.length - 1
                this.global_logic_vars.active_input_handler = this.equations[this.display_equation_index]
                this.global_logic_vars.active_input_handler.update_display()
                this.global_logic_vars.active_input_handler.update_position();
            break;

            case "key_dir0":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history.slice(0, -1)
                this.display_equation_index = this.equations.length - 1
                this.global_logic_vars.active_input_handler = this.equations[this.display_equation_index]
                this.global_logic_vars.active_input_handler.handle("end")
                this.global_logic_vars.active_input_handler.update_position();
            break;

            case "key_dir2":
                this.add_empty_equation()
                this.equations[this.equations.length - 1].input_code_history = this.equations[this.display_equation_index].input_code_history.slice(0, -1)
                this.display_equation_index = this.equations.length - 1
                this.global_logic_vars.active_input_handler = this.equations[this.display_equation_index]
                this.global_logic_vars.active_input_handler.handle("pos1")
                this.global_logic_vars.active_input_handler.update_position();
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
                this.global_logic_vars.active_input_handler = this.equations[this.display_equation_index]
                if([
                    "key_+",
                    "key_-",
                    "key_÷",
                    "key_x"
                ].includes(input_code)){
                    this.global_logic_vars.active_input_handler.handle("key_Ans")
                }
                this.global_logic_vars.active_input_handler.handle(input_code)
                this.global_logic_vars.active_input_handler.update_position();
            break;
        }
    }

    update_display() {
        if(this.equations.length > 0){
            this.math_input_element.innerHTML = this.input_strings[this.display_equation_index]
            this.math_output_element.innerHTML = this.formatNumber(this.results[this.display_equation_index],this.as_fraction)
            this.math_input_element.scroll(0,0)
            this.ui.vertical_align_elements()
        }
    }

    update_position() {
        this.ui.align_element(this.display_input_element, this.math_input_element);
        this.ui.align_element(this.display_output_element, this.math_output_element);
    }
}

module.exports = { InputHandler, EquationSelectInputHandler, import_custom_math }