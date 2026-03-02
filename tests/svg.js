/*
What does this test test?
This tests that all SVG in the www/img/gui are valid and contain the necessary metadata
*/

const fs = require('fs');
const path = require('path');
const { test, describe } = require('node:test');
const assert = require('node:assert');
const xml2js = require('xml2js');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const directory = path.join(__dirname, '..', 'www', 'img', 'gui');

describe('SVG Tests', () => {
    const files = fs.readdirSync(directory).filter(file => file.endsWith('.svg'));

    files.forEach(file => {
        test(`SVG ${file} filename should match <Design Name>_by_<Author Name>.svg`, (t) => {
            const pattern = /^.+_by_.+\.svg$/;
 
            assert.ok(
                pattern.test(file),
                `${file} does not match the expected pattern "<Design Name>_by_<Author Name>.svg"`
            );
        });
        test(`There should be a corresponding JSON file for ${file}`, (t) => {
            const json_file_name = file.substring(0,file.length - 4) + ".json"
            const json_file_path = path.join(directory, json_file_name);
            const json_file = fs.readFileSync(json_file_path, 'utf8');
            const json_object = JSON.parse(json_file)

            const hexColorPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

            assert.ok(
                hexColorPattern.test(json_object.font_color),
                `${json_file_name} font_color is not a valid hex color`
            );
            assert.deepStrictEqual(typeof json_object.mode_maps.shift,"object")
            assert.deepStrictEqual(typeof json_object.mode_maps.cmplx,"object")
            assert.deepStrictEqual(typeof json_object.mode_maps.alpha,"object")
            assert.deepStrictEqual(typeof json_object.mode_maps.STO,"object")
        })
        test(`SVG ${file} should contain an author`, (t) => {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf8');
            xml2js.parseString(content, (err, result) => {
                if (err) {
                    assert.fail(`XML parse error in ${file}: ${err}`)
                }

                try {
                    // Navigate metadata -> rdf:RDF -> cc:Work -> dc:creator -> cc:Agent -> dc:title
                    const metadata = result.svg.metadata?.[0];
                    if (!metadata) throw new Error('No <metadata> found');

                    const rdf = metadata['rdf:RDF']?.[0];
                    if (!rdf) throw new Error('No <rdf:RDF> found');

                    const work = rdf['cc:Work']?.[0];
                    if (!work) throw new Error('No <cc:Work> found');

                    const creator = work['dc:creator']?.[0];
                    if (!creator) throw new Error('No <dc:creator> found');

                    const agent = creator['cc:Agent']?.[0];
                    if (!agent) throw new Error('No <cc:Agent> found');

                    const title = agent['dc:title']?.[0];
                    if (!title) throw new Error('No <dc:title> found');

                    console.log(`Author for ${file}: "${title.trim()}"`);
                    assert.notStrictEqual(title.trim(),"")
                } catch (e) {
                    assert.fail(`${file}: ${e.message}`)
                }
            });
        });
        test(`SVG ${file} should contain an creation date`, (t) => {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf8');
            xml2js.parseString(content, (err, result) => {
                if (err) {
                    assert.fail(`XML parse error in ${file}: ${err}`)
                }

                try {
                    // Navigate metadata -> rdf:RDF -> cc:Work -> dc:creator -> cc:Agent -> dc:title
                    const metadata = result.svg.metadata?.[0];
                    if (!metadata) throw new Error('No <metadata> found');

                    const rdf = metadata['rdf:RDF']?.[0];
                    if (!rdf) throw new Error('No <rdf:RDF> found');

                    const work = rdf['cc:Work']?.[0];
                    if (!work) throw new Error('No <cc:Work> found');

                    const svg_date = work['dc:date']?.[0];
                    if (!svg_date) throw new Error('No <dc:date> found');

                    console.log(`Date for ${file}: "${svg_date.trim()}"`);
                    assert.notStrictEqual(svg_date.trim(),"")
                } catch (e) {
                    assert.fail(`${file}: ${e.message}`)
                }
            });
        });
        test(`SVG ${file} should contain an open source license`, (t) => {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf8');
            xml2js.parseString(content, (err, result) => {
                if (err) {
                    assert.fail(`XML parse error in ${file}: ${err}`)
                }

                try {
                    // Navigate metadata -> rdf:RDF -> cc:Work -> dc:creator -> cc:Agent -> dc:title
                    const metadata = result.svg.metadata?.[0];
                    if (!metadata) throw new Error('No <metadata> found');

                    const rdf = metadata['rdf:RDF']?.[0];
                    if (!rdf) throw new Error('No <rdf:RDF> found');

                    const work = rdf['cc:Work']?.[0];
                    if (!work) throw new Error('No <cc:Work> found');

                    const license = work['cc:license']?.[0];
                    if (!license) throw new Error('No <cc:license> found');

                    const license_url = license['$']['rdf:resource']
                    console.log(`License for ${file}: "${license_url}"`);
                    const validExpected = [
                        "http://creativecommons.org/licenses/by-sa/4.0/",
                        "http://creativecommons.org/licenses/by/4.0/",
                        "http://creativecommons.org/publicdomain/zero/1.0/",
                        "https://unlicense.org/"
                    ];
                    assert.ok(validExpected.includes(license_url), `Expected one of ${validExpected.join(', ')}, but got ${license_url}`);
                } catch (e) {
                    assert.fail(`${file}: ${e.message}`)
                }
            });
        });
        test(`SVG ${file} should be safe and sanitized`, (t) => {
            const window = new JSDOM('').window;
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf8')
                .replaceAll("cc:Agent", "g")
                .replaceAll("cc:license", "g")
                .replaceAll("cc:License", "g")
                .replaceAll("cc:permits", "g")
                .replaceAll("cc:requires", "g")
                .replaceAll("cc:Work", "g")
                .replaceAll("dc:creator", "g")
                .replaceAll("dc:date", "g")
                .replaceAll("dc:rights", "g")
                .replaceAll("dc:title", "g")
                .replaceAll("rdf:RDF", "g")
                .replaceAll('xmlns:cc="http://creativecommons.org/ns#"', "")
                .replaceAll('xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"', "")
                .replaceAll('xmlns:dc="http://purl.org/dc/elements/1.1/"', "")   
                .replaceAll('xmlns:svg="http://www.w3.org/2000/svg"', "")
            const DOMPurify = createDOMPurify(window);

            const clean_content = DOMPurify.sanitize(content, {
                USE_PROFILES: { svg: true, svgFilters: true },
                ADD_TAGS: ['#comment'],
                ADD_ATTR: [
                    "rdf:about",
                    "rdf:resource"
                ],
                FORCE_BODY: true,
                WHOLE_DOCUMENT: true
            });

            const raw_wrapper_div = window.document.createElement("div")
            const clean_wrapper_div = window.document.createElement("div")


            raw_wrapper_div.innerHTML = content
            clean_wrapper_div.innerHTML = clean_content

            if (!fs.existsSync("temp")){
                fs.mkdirSync("temp");
            }

            fs.writeFileSync("temp/"+file+"_raw.svg", raw_wrapper_div.innerHTML, 'utf8');
            fs.writeFileSync("temp/"+file+"_cleaned.svg", clean_wrapper_div.innerHTML, 'utf8');

            assert.equal(clean_wrapper_div.innerHTML,raw_wrapper_div.innerHTML, `${file} was altered by DOMPurify!`)
        });
    });
});