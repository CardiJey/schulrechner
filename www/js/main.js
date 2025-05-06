let active_input_handler;
let next_align_id = 0
let changelog_visible = false
let version;

fetch("changelog.txt")
    .then((res) => res.text())
    .then((text) => {
        const lines = text.trim().split("\n");

        if (lines.length === 0) return;

        const versionLine = lines[0]; // First line is the version, e.g. "- 1.1.10"
        const version = versionLine.replace(/^- /, "").trim(); // remove leading "- "

        document.getElementById("version").innerText = "What's new in " + version + "?";
        document.getElementById("version-small").innerText = version;

        const lastSeenVersion = localStorage.getItem("lastSeenVersion");
        if (lastSeenVersion !== version) {
            toggle_changelog(); // Show changelog automatically
            localStorage.setItem("lastSeenVersion", version);
        }

        // The rest is the actual changelog
        const changelogLines = lines.slice(1);
        const changelog_content = document.getElementById("changelog-content")
        for(let line_index = 0; line_index < changelogLines.length; line_index++){
            let line = changelogLines[line_index]
            line = line.replaceAll("- - ","- ")
            let line_class;

            if(line.startsWith("- Feature: ")){
                line_class = "changelog-feature"
            }else if(line.startsWith("- Bugfix: ")){
                line_class = "changelog-bugfix"
            }else if(line.startsWith("- Tweak: ")){
                line_class = "changelog-tweak"
            }else{
                continue
            }

            let line_element = document.createElement("span")
            line_element.classList.add(line_class)
            line_element.innerText = line
            changelog_content.appendChild(line_element)
        }
    })
    .catch((e) => console.error(e));

function toggle_changelog(){
    changelog_visible = !changelog_visible
    if(changelog_visible){
        document.getElementById("changelog").style.visibility = "visible"
    }else{
        document.getElementById("changelog").style.visibility = "hidden"
    }
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

    negate(){
        this.negative_sign = !this.negative_sign
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
    constructor(left,var_name){
        super("sto",left,"→"+var_name,"")
        this.var_name = var_name
    }

    operate(val){
        active_input_handler.parent_handler.user_var[this.var_name] = val
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
    constructor(left){
        super("point_operation",left,",",".")
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
    constructor(left){
        let [next_left_neighbor,last_element,first_element] = get_left_block(left)
        
        let align_id = next_align_id
        next_align_id++
        super("container_operation",next_left_neighbor,"<span class='alignLeft" + align_id + "'></span><span class='frac_wrapper'><span class='frac_top'>","([")
        if(last_element){
            last_element.neighbors[0] = this

            this.children = [
                new Container_Element(first_element,"</span><span class='frac_bottom alignRight" + align_id + "'>","][1]/[",this,false)
            ]
        }else{
            this.children = [
                new Container_Element(this,"</span><span class='frac_bottom alignRight" + align_id + "'>","][1]/[",this,false)
            ]
        }
        
        this.children.push(
            new Container_Element(this.children[0],"</span></span>","][1])",this,true)
        )
        this.neighbors[1] = this.children[0]
        this.children[0].neighbors[3] = this

        if(last_element){
            this.skip_to_element_after_creation = this.children[0]
        }
    }
}

class Sqrt_Element extends Math_Element{
    constructor(left){
        super("container_operation",left,"<span class='sqrt_wrapper'><span class='scale_height'>&#8730;</span><span class='sqrt'>","([")
        this.children = [
            new Container_Element(this,"</span></span>","][1]^0.5)",this,true)
        ]
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

class Container_Element extends Math_Element{
    constructor(left,value,mathjs_value,parent,last_container){
        super("container",left,value,mathjs_value)
        this.parent = parent
        this.last_container = last_container
    }
}

class Sin_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"sin(","sin(PI/180*")
    }
}

class Cos_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"cos(","cos(PI/180*")
    }
}

class Tan_Element extends Math_Element{
    constructor(left){
        super("brackets_operation",left,"tan(","tan(PI/180*")
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
    constructor(left){
        super("var",left,"Ans","")
    }

    get_value(){
        return active_input_handler.parent_handler.results[active_input_handler.parent_handler.results.length - 1]
    }
}

class User_Var_Element extends Math_Element{
    constructor(left,var_name){
        super("var",left,var_name,"")
        this.var_name = var_name
    }

    get_value(){
        if(active_input_handler.parent_handler.user_var[this.var_name]){
            return active_input_handler.parent_handler.user_var[this.var_name]
        }else{
            return 0
        }
    }
}

class Const_Element extends Math_Element{
    constructor(left,index){
        const char_map = [
            "mp",
            "mn",
            "me",
            "mμ",
            "a0",
            "h",
            "μN",
            "μB",
            "ħ",
            "α",
            "re",
            "λc",
            "γp",
            "λc,p",
            "λc,n",
            "R∞",
            "u",
            "μp",
            "μe",
            "μn",
            "μμ",
            "F",
            "e",
            "NA",
            "k",
            "Vm",
            "R",
            "C0",
            "C1",
            "C2",
            "σ",
            "ε0",
            "μ0",
            "Φ0",
            "g",
            "G0",
            "Z0",
            "t",
            "G",
            "atm",
            "π",
            "e",
        ]
        super("var",left,char_map[index],"")
        this.index = index
    }

    get_value(){
        const value_map = [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            Math.PI,
            Math.E
        ]

        return value_map[this.index]
    }
}

class InputHandler{
    constructor(display_input_element, math_input_element, display_output_element, math_output_element) {
        this.display_input_element = display_input_element;
        this.display_output_element = display_output_element;
        this.math_input_element = math_input_element;
        this.math_output_element = math_output_element;
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
        this.modes = {
            "shift": false,
            "alpha": false,
            "STO": false
        }
        this.mode_maps = {
            "shift": {
                "key_pow10": "key_pi",
                "key_rcl": "key_STO"
            },
            "alpha": {
                "key_pow10": "key_e",
                "key_(-)": "key_uservar_A",
                "key_°": "key_uservar_B",
                "key_hyp": "key_uservar_C",
                "key_sin": "key_uservar_D",
                "key_cos": "key_uservar_E",
                "key_tan": "key_uservar_F",
                "key_)": "key_uservar_X",
                "key_SD": "key_uservar_Y",
                "key_M+": "key_uservar_M",
            },
            "STO": {
                "key_(-)": "key_STO_A",
                "key_°": "key_STO_B",
                "key_hyp": "key_STO_C",
                "key_sin": "key_STO_D",
                "key_cos": "key_STO_E",
                "key_tan": "key_STO_F",
                "key_)": "key_STO_X",
                "key_SD": "key_STO_Y",
                "key_M+": "key_STO_M",
            }
        }
    }

    toggle_mode(mode_to_toggle){
        for(let mode in this.modes){
            if(mode == mode_to_toggle){
                this.modes[mode] = !this.modes[mode]
            }else{
                this.modes[mode] = false
            }

            if(this.modes[mode]){
                document.querySelector('[inkscape\\3a label="indicator_' + mode + '"]').style.visibility = "visible"
            }else{
                document.querySelector('[inkscape\\3a label="indicator_' + mode + '"]').style.visibility = "hidden"
            }
        }
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
                    this.input_code_history.push("key_=");
                }
            }else{
                this.input_code_history.push(input_code);
            }
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
                            res += '<span class="cursor">\uE000</span>'
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
                res += '<span class="cursor">\uE000</span>'
            }
            if(sto){
                mathjs_res = "syntax_error"
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
        console.log(mathjs_res)
        return [res,mathjs_res,sto]
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

                case "key_uservar_A":
                case "key_uservar_B":
                case "key_uservar_C":
                case "key_uservar_D":
                case "key_uservar_E":
                case "key_uservar_F":
                case "key_uservar_X":
                case "key_uservar_Y":
                case "key_uservar_M":
                    new_element = new User_Var_Element(cursor_element,input_code.substring(12))
                    cursor_element = new_element
                    break;
                
                case "key_pi":
                    new_element = new Const_Element(cursor_element,40)
                    cursor_element = new_element
                    break;
                
                case "key_e":
                    new_element = new Const_Element(cursor_element,41)
                    cursor_element = new_element
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
                    if(cursor_element.type != "start" || cursor_element.neighbors[2]){
                        while(cursor_element.neighbors[2]){
                            cursor_element = cursor_element.neighbors[2]
                        }
                        new_element = new Sto_Element(cursor_element,input_code.substring(8))
                        cursor_element = new_element
                    }
                    break;
                
                case "key_comma":
                    new_element = new Point_Element(cursor_element)
                    cursor_element = new_element
                    break;
                
                case "key_pow10":
                    new_element = new Pow10_Element(cursor_element)
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
                    new_element = new Pow_Element(cursor_element,false)
                    cursor_element = new_element
                    break;

                case "key_pow2":
                    new_element = new Pow_Element(cursor_element,true)
                    cursor_element = new_element
                    var prefilled_element = new Int_Element(cursor_element.children[0],2)
                    prefilled_element.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element
                    break;

                case "key_pow-1":
                    new_element = new Pow_Element(cursor_element,true)
                    cursor_element = new_element
                    var prefilled_element1 = new Minus_Element(cursor_element.children[0])
                    var prefilled_element2 = new Int_Element(prefilled_element1,1)
                    prefilled_element2.neighbors[2] = cursor_element.children[1]
                    cursor_element.children[1].neighbors[0] = prefilled_element2
                    break;

                case "key_logn":
                    new_element = new Logx_Element(cursor_element)
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
                if(new_element.skip_to_element_after_creation){
                    cursor_element = new_element.skip_to_element_after_creation
                }
                
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
            let [this_input_string,this_output_string,sto] = this.math_elements_to_string(res,cursor_element,false)
            let this_result
            try {
                this_result = parseFloat(math.evaluate(this_output_string))
            } catch (error) {
                this_result = "syntax_error"
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
                active_input_handler = this.parent_handler
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
        this.user_var = {}

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
        document.getElementById("changelog").addEventListener('pointerdown', toggle_changelog)
        document.getElementById("version-small").addEventListener('pointerdown', toggle_changelog)
    }
});
