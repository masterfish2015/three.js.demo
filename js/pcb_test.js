var ldc = {}

function load_pcb_data() {
    let filename = $('#pcb-file-select').val()
    let fullname = '../pcb/' + filename + '.pcb'

    ldc = { holder: {}, Components: [], Pads: [], Outlines: [], Wires: [], Vias: [], Overlay: [] }

    jQuery.get(fullname, function(data) {
        let lines = data.split('\n')
        let count = lines.length
        for (let i in lines) { // 每行
            let properties = lines[i].split('|'); // 每个属性之间用|来分割
            let obj = {}
            for (var j in properties) {
                if (properties[j]) { // 如果属性存在
                    let key, value
                    let kv = properties[j].split('=')
                    key = kv[0]
                    value = kv[1]
                        // console.log(key+":"+value)
                    obj[key] = value
                }
            }
            if (obj === {}) continue
            switch (obj['RECORD']) {
                case 'Component':
                    {
                        ldc.Components.push(obj)
                    }
                    break
                case 'Pad':
                    {
                        ldc.Pads.push(obj)
                    }
                    break
                case 'Fill':
                case 'Track':
                case 'Arc':
                    {
                        switch (obj['LAYER']) {
                            case 'KEEPOUT':
                                // case 'MECHANICAL4':
                                { // 这是PCB外轮廓的轮廓线
                                    ldc.Outlines.push(obj)
                                }
                                break
                            case 'TOP':
                            case 'BOTTOM':
                                { // 这是导线
                                    ldc.Wires.push(obj)
                                }
                                break
                            case 'MECHANICAL4':
                            case 'MECHANICAL1':
                            case 'TOPOVERLAY':
                            case 'BOTTOMOVERLAY':
                                { // 这是丝印图形
                                    ldc.Overlay.push(obj)
                                }
                                break
                        } // ---end of switch
                    }
                    break
                case 'Via':
                    { // 这是导通孔
                        ldc.Vias.push(obj)
                    }
                    break
            } // end of switch

            // ---------------------显示读取进度
            let value = Math.round(Number(i) * 100 / count)
                // $('#status-bar').css('width', value + '%').attr('aria-valuenow', value)
                // $('#status-bar').attr("aria-valuenow", str)
        } // end of for
        // 生成表格
        // _generate_all_table()

        // enable draw button
        // $('#load_pcb_btn').attr('disabled', 'disabled').removeClass('btn-info').addClass('btn-default')
        $('#draw_pcb_btn').removeAttr('disabled').removeClass('btn-default').addClass('btn-info')
    })
}

function _generate_all_table() {
    // --元器件表格
    _generate_table('components-table', ldc.Components, {
            '序号': 'ID',
            '所在图层': 'LAYER',
            '封装类型': 'PATTERN',
            'X': 'X',
            'Y': 'Y',
            '旋转角': 'ROTATION'
        })
        // --焊盘表格
    _generate_table('pad-table', ldc.Pads, {
            '所属元器件': 'COMPONENT',
            '所在图层': 'LAYER',
            '类型': 'SHAPE',
            'X': 'X',
            'Y': 'Y',
            'TOPXSIZE': 'TOPXSIZE',
            'MIDXSIZE': 'MIDXSIZE',
            'BOTXSIZE': 'BOTXSIZE',
            'TOPYSIZE': 'TOPYSIZE',
            'MIDYSIZE': 'MIDYSIZE',
            'BOTYSIZE': 'BOTYSIZE',
            'X-SIZE': 'XSIZE',
            'Y-SIZE': 'YSIZE',
            'HOLESIZE': 'HOLESIZE',
            '旋转角': 'ROTATION'
        })
        // --电路板表格
    _generate_table('outline-table', ldc.Outlines, {
        '类型': 'RECORD',
        '所在图层': 'LAYER',
        'X1': 'X1',
        'Y1': 'Y1',
        'X2': 'X2',
        'Y2': 'Y2',
        'LOCATION.X': 'LOCATION.X',
        'LOCATION.Y': 'LOCATION.Y',
        'RADIUS': 'RADIUS',
        'WIDTH': 'WIDTH',
        'STARTANGLE': 'STARTANGLE',
        'ENDANGLE': 'ENDANGLE',
        '旋转角': 'ROTATION'
    })
}

// 生成表格的通用函数
// tag：表格所在div的id
// array：表格数据
// fields：表格域标题：数组中对应的元素key
function _generate_table(tag, array, fields) {
    if (array.length > 0) {
        var str = "<table border='1' class='table'>"
        str += '<tr>'
        for (var key in fields) {
            str += '<th>' + key + '</th>'
        }
        str += '</tr>'
        for (var i in array) {
            str += '<tr>'
            for (var key in fields) {
                var value = array[i][fields[key]] || ' '
                if (value === ' ') {
                    str += '<td> </td>'
                } else {
                    str += '<td>' + key + ':' + value + '</td>'
                }
            }
            str += '</tr>'
        }
        str += '</table>'
        $('#' + tag).html(str)
    }
}

// 绘制电路板
function draw_pcb() {
    if (ldc.scene === undefined) {
        ldc.scene = new THREE.Scene()
    } else {
        let obj, i
        for (i = ldc.scene.children.length - 1; i >= 0; i--) {
            obj = ldc.scene.children[i]
            if (obj.type === 'Mesh') {
                ldc.scene.remove(obj)
            }
        }
    }
    // ldc.ambientLight = new THREE.AmbientLight({ color: 0x0f0000 })
    // ldc.scene.add(ldc.ambientLight)

    if (ldc.renderer === undefined) {
        ldc.camera = new THREE.PerspectiveCamera(45,
            window.innerWidth / window.innerHeight,
            0.1,
            100000)

        ldc.holder = new THREE.Group()
        ldc.scene.add(ldc.holder)

        ldc.renderer = new THREE.WebGLRenderer()
        ldc.renderer.setClearColor(0x1E1E1E)
        ldc.renderer.setSize(window.innerWidth, window.innerHeight)
        ldc.renderer.shadowMapEnabled = true
        ldc.renderer.shadowMap.enabled = true
        ldc.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        ldc.renderer.gammaInput = true
        ldc.renderer.gammaOutput = true
        ldc.child = $('#webgl-output').append(ldc.renderer.domElement)

        ldc.orbit = new THREE.OrbitControls(ldc.camera, ldc.renderer.domElement)

        ldc.spotLight = new THREE.SpotLight(0xffffff, 1, 35500)
        ldc.spotLight.position.set(0, 0, 20000)
        ldc.spotLight.castShadow = true
        ldc.scene.add(ldc.spotLight)

        ldc.spotLight2 = new THREE.SpotLight(0xffffff, 1, 35500)
        ldc.spotLight2.position.set(-10000, -10000, -20000)
        ldc.spotLight2.castShadow = true
        ldc.scene.add(ldc.spotLight2)
    }
    $('#status-bar').css('width', '0%').attr('aria-valuenow', 0)
    _add_pcb_board(); // 绘制PCB板外形
    $('#status-bar').css('width', 25 + '%').attr('aria-valuenow', 25)
    _add_pcb_pad(); // 绘制焊盘
    $('#status-bar').css('width', 50 + '%').attr('aria-valuenow', 50)
    _add_pcb_wire(); // 绘制导线
    $('#status-bar').css('width', 70 + '%').attr('aria-valuenow', 70)
    _add_pcb_via(); // 绘制导通孔
    $('#status-bar').css('width', 80 + '%').attr('aria-valuenow', 80)
    _add_pcb_overlay(); // 绘制丝印图形
    $('#status-bar').css('width', 100 + '%').attr('aria-valuenow', 100)

    // var spotLightHelper = new THREE.SpotLightHelper(ldc.spotLight)
    // ldc.scene.add(spotLightHelper)

    ldc.camera.position.z = 10000
    ldc.camera.lookAt(new THREE.Vector3(4000, 4000, 0))

    ldc.holder.position.set(-8000, -4000, 0)

    _renderScene()
}

/*
各种金属颜色的RGB值，正确的颜色会有更好的表现效果
铝箔 180,180,180
铝箔（钝) 180,180,180 
铝 220,223,227
磨亮的铝 220,223,227
黄铜 191,173,111
磨亮的黄铜 191,173,111
镀铬合金 150,150,150
镀铬合金2 220,230,240
镀铬铝 220,230,240
镀铬塑料 220,230,240
镀铬钢 220,230,240  
纯铬 220,230,240  
铜 186,110,64
18K金 234,199,135
24K金 218,178,115
未精练的金 255,180,66 黄金 242,192,86
石墨 87,33,77 铁 118,119,120  
铅锡锑合金 250,250,250
银 233,233,216
钠 250,250,250
废白铁罐 229,223,206
不锈钢 128,128,126
磨亮的不锈钢 220,220,220
锡 220,223,227

*/
var _copper_material = new THREE.MeshPhongMaterial({ color: 'rgb(191,173,111)' })
var _overlay_material = new THREE.MeshNormalMaterial({ color: 'rgb(0,0,250)' })
var _extrudeSettings = { amount: 10, bevelEnabled: false, steps: 2 }

// 绘制丝印图形
function _add_pcb_overlay() {
    for (let i in ldc.Overlay) {
        switch (ldc.Overlay[i]['RECORD']) {
            case 'Track': // 
                {
                    _draw_pcb_overlay_track(ldc.Overlay[i])
                }
                break
            case 'Arc':
                {
                    _draw_pcb_overlay_arc(ldc.Overlay[i])
                }
        }
    }
}

var _line_material = new THREE.LineBasicMaterial({ color: 'rgb(255,255,0)', lineWidth: 5 })

// 实际绘制直线丝印图形
function _draw_pcb_overlay_track(track) {
    let x1 = parseFloat(track['X1']),
        x2 = parseFloat(track['X2']),
        y1 = parseFloat(track['Y1']),
        y2 = parseFloat(track['Y2']),
        width = parseFloat(track['WIDTH'])

    let z = 30
    switch (track['LAYER']) {
        case 'TOPOVERLAY':
            z = 30
            break
        case 'BOTTOMOVERLAY':
            z = 0
            break
    }

    let geo = new THREE.Geometry()
    geo.vertices.push(new THREE.Vector3(x1, y1, z))
    geo.vertices.push(new THREE.Vector3(x2, y2, z))

    let line = new THREE.Line(geo, _line_material);
    ldc.holder.add(line)

}

// 绘制圆弧丝印图形
function _draw_pcb_overlay_arc(arc) {
    let xc = parseFloat(arc['LOCATION.X']),
        yc = parseFloat(arc['LOCATION.Y']),
        r = parseFloat(arc['RADIUS']),
        start_angle = parseFloat(arc['STARTANGLE']),
        end_angle = parseFloat(arc['ENDANGLE']),
        width = parseFloat(arc['WIDTH']);

    let z = 30
    switch (arc['LAYER']) {
        case 'TOPOVERLAY':
            z = 30
            break
        case 'BOTTOMOVERLAY':
            z = 0
            break
    }

    let geo = new THREE.Geometry();
    let step = (end_angle - start_angle) / 6;
    if (start_angle < end_angle) {
        for (let angle = start_angle; angle <= end_angle; angle += step) {
            let x = xc + r * Math.cos(angle * Math.PI / 180.0),
                y = yc + r * Math.sin(angle * Math.PI / 180.0);

            geo.vertices.push(new THREE.Vector3(x, y, z));
        }
    }
    let mesh = new THREE.Line(geo, _line_material);

    ldc.holder.add(mesh)
}

// 绘制导通孔
function _add_pcb_via() {
    for (let i in ldc.Vias) {
        _draw_pcb_via(ldc.Vias[i])
    }
}

// 实际绘制导通孔
function _draw_pcb_via(via) {
    let x = parseFloat(via['X']),
        y = parseFloat(via['Y']),
        diameter = parseFloat(via['DIAMETER']),
        holesize = parseFloat(via['HOLESIZE'])

    let shape = new THREE.Shape()
    shape.absarc(x, y, diameter / 2, 0, 2 * Math.PI, true)

    _extrudeSettings.amount = 30
    let geo = new THREE.ExtrudeGeometry(shape, _extrudeSettings)
    let mesh = new THREE.Mesh(geo, _copper_material)

    ldc.holder.add(mesh)
}

// 绘制焊盘
function _add_pcb_pad() {
    for (let i in ldc.Pads) {
        let shape = new THREE.Shape()
        _draw_pcb_pad(ldc.Pads[i])
            // console.log('x:' + x + ',y:' + y + ',xsize:' + xsize + ',ysize:' + ysize + ',angle:' + rotation)
    } // end of for
} // end of function

// 辅助函数，绘制圆弧
// 主要是three.js提供的arc函数绘制的曲线无法形成合乎要求的shape以及进行拉伸
function _draw_shape_arc(shape, x, y, r, startAngle, endAngle) {
    shape.moveTo(x + r * Math.cos(startAngle), y + r * Math.sin(startAngle))
    let step = (endAngle - startAngle) / 6
    if (step > 0) {
        for (let ang = startAngle; ang <= endAngle; ang += step) {
            let x1 = x + r * Math.cos(ang),
                y1 = y + r * Math.sin(ang)
            shape.lineTo(x1, y1)
        }
    } else {
        for (let ang = startAngle; ang >= endAngle; ang += step) {
            let x1 = x + r * Math.cos(ang),
                y1 = y + r * Math.sin(ang)
            shape.lineTo(x1, y1)
        }
    }
}

// 绘制PCB板圆形焊盘的shape
function _draw_circle_pad_shape(shape, xsize, ysize, rotation) {
    if (xsize === ysize) {
        // 如果两个尺寸相同
        shape.absarc(0, 0, xsize / 2, 0, Math.PI * 2, false)
    } else {
        // 如果不同
        if (xsize > ysize) {
            let t = xsize
            xsize = ysize
            ysize = t
            rotation.angle += 90
        } else {}
        let y1 = (ysize - xsize) / 2,
            x1 = xsize / 2,
            r = x1
        shape.moveTo(x1, -y1)
        shape.lineTo(x1, y1)
        _draw_shape_arc(shape, 0, y1, r, 0, Math.PI)
        shape.lineTo(-x1, -y1)
        _draw_shape_arc(shape, 0, -y1, r, -Math.PI, 0)
    }
}

// 绘制PCB板矩形焊盘的shape
function _draw_rectangle_pad_shape(shape, xsize, ysize, rotation) {
    shape.moveTo(0 - xsize / 2, 0 - ysize / 2)
    shape.lineTo(0 + xsize / 2, 0 - xsize / 2)
    shape.lineTo(0 + xsize / 2, 0 + ysize / 2)
    shape.lineTo(0 - xsize / 2, 0 + ysize / 2)
}

// 焊盘开孔
function _draw_pad_shape_hole(shape, holesize) {
    if (holesize > 0) {
        let hole = new THREE.Path()
        hole.absarc(0, 0, holesize / 2, 0, Math.PI * 2, true)
        shape.holes.push(hole)
    }
}

// 拉伸焊盘
function _draw_pad_mesh(shape, x, y, z, rotation, name, material, extrudeSettings) {
    let geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    let pad = new THREE.Mesh(geo, material)
    pad.rotation.z = rotation.angle * Math.PI / 180.0 // 以世界坐标原点进行旋转
    pad.name = 'pad-' + name
    pad.position.set(x, y, z)
    pad.castShadow = true
    ldc.holder.add(pad)
}

// 绘制实际焊盘（包括绘制外形，开孔，拉伸）
function _draw_pcb_pad(pad) {
    let xsize_top = 0,
        ysize_top = 0,
        xsize_bottom = 0,
        ysize_bottom = 0 // 多层焊盘尺寸
    let x = parseFloat(pad['X']),
        y = parseFloat(pad['Y']),
        holesize = parseFloat(pad['HOLESIZE']),
        rotation = { 'angle': parseFloat(pad['ROTATION']) }
    let material = _copper_material
    let extrudeSettings = { amount: 10, bevelEnabled: false, steps: 2 }
        // 下面是根据不同的焊盘形状选择不同绘制函数
    let real_draw_pad_shape = { 'ROUND': _draw_circle_pad_shape, 'RECTANGLE': _draw_rectangle_pad_shape }

    let shape = new THREE.Shape()

    switch (pad['LAYER']) {
        case 'MULTILAYER': // 多层贯通焊盘，只有一个尺寸
            {
                xsize_bottom = xsize_top = parseFloat(pad['XSIZE'])
                ysize_bottom = ysize_top = parseFloat(pad['YSIZE'])
                real_draw_pad_shape[pad['SHAPE']](shape, xsize_top, ysize_top, rotation)
                _draw_pad_shape_hole(shape, holesize)
                extrudeSettings.amount = 50
                _draw_pad_mesh(shape, x, y, -10, rotation, pad['NAME'], material, extrudeSettings)
            }
            break
        case 'TOP': // 只有顶层
            {
                xsize_top = parseFloat(pad['TOPXSIZE'])
                ysize_top = parseFloat(pad['TOPYSIZE'])
                real_draw_pad_shape[pad['SHAPE']](shape, xsize_top, ysize_top, rotation)
                _draw_pad_shape_hole(shape, holesize)
                extrudeSettings.amount = 10
                _draw_pad_mesh(shape, x, y, 30, rotation, pad['NAME'], material, extrudeSettings)
            }
            break
        case 'BOTTOM': // 只有底层
            {
                xsize_bottom = parseFloat(pad['BOTXSIZE'])
                ysize_bottom = parseFloat(pad['BOTYSIZE'])
                real_draw_pad_shape[pad['SHAPE']](shape, xsize_bottom, ysize_bottom, rotation)
                _draw_pad_shape_hole(shape, holesize)
                extrudeSettings.amount = 10
                _draw_pad_mesh(shape, x, y, -10, rotation, pad['NAME'], material, extrudeSettings)
            }
            break
    }
}

// 绘制PCB板上的导线
function _add_pcb_wire() {
    for (let i in ldc.Wires) {
        if (ldc.Wires[i]['RECORD'] === 'Track')
            _draw_pcb_wire_mesh(_draw_pcb_shape_line(ldc.Wires[i]), ldc.Wires[i]['LAYER'])
    }
}

// 实际生成导线实体
function _draw_pcb_wire_mesh(wire_shape, layer) {
    let geo = new THREE.ExtrudeGeometry(wire_shape, _extrudeSettings)
    let mesh = new THREE.Mesh(geo, _copper_material)
    mesh.rotation.z = wire_shape.rotation

    let z = 30
    switch (layer) {
        case 'TOP':
            z = 30
            break
        case 'BOTTOM':
            z = -10
            break
    }
    mesh.position.set(wire_shape.cx, wire_shape.cy, z)

    ldc.holder.add(mesh)
}

// 实际绘制直线导线形状
function _draw_pcb_shape_line(line) {
    let shape = new THREE.Shape()
    let x1 = parseFloat(line['X1']),
        y1 = parseFloat(line['Y1']),
        x2 = parseFloat(line['X2']),
        y2 = parseFloat(line['Y2']),
        width = parseFloat(line['WIDTH'])

    let xa, ya, xb, yb, xc, yc, xd, yd

    if (x1 > x2) {
        xa = x2
        ya = y2
        xb = x1
        yb = y1
    } else {
        xa = x1
        ya = y1
        xb = x2
        yb = y2
    }

    let length = Math.sqrt((xa - xb) * (xa - xb) + (ya - yb) * (ya - yb))

    shape.moveTo(0, width / 2)
        // shape.lineTo(0, -width / 2)
    _draw_shape_arc(shape, 0, 0, width / 2, Math.PI / 2, Math.PI * 3 / 2)
        // shape.absarc(0, 0, width / 2, Math.PI / 2, -Math.PI / 2, true)
    shape.lineTo(length, -width / 2)
        // _draw_shape_arc(shape, length, 0, width / 2, 3 * Math.PI / 2, 5 * Math.PI / 2)
        // shape.moveTo(length, width / 2);    
        // shape.lineTo(length, +width / 2)
    shape.absarc(length, 0, width / 2, -Math.PI / 2, Math.PI / 2, true)
    shape.lineTo(0, width / 2)

    shape.rotation = Math.asin((yb - ya) / length)
    shape.cx = xa
    shape.cy = y1

    return shape
}

// 绘制电路板外形
function _add_pcb_board() {
    var shape = new THREE.Shape() // 创建Shape对象，作为电路板的平面截面，后继进行拉伸
    var border_lines = [] // 保存电路板外形的各个边界线
        // 以下循环将各个边界数据放入数组中
    for (let i = 0; i < ldc.Outlines.length; i++) {
        var s = ldc.Outlines[i]
        switch (s['RECORD']) {
            case 'Track':
                {
                    var x1 = parseFloat(s['X1']),
                        y1 = parseFloat(s['Y1']),
                        x2 = parseFloat(s['X2']),
                        y2 = parseFloat(s['Y2'])
                    border_lines.push({ x1: x1, y1: y1, x2: x2, y2: y2, check: false })
                }
                break
        }
    }

    // 边界线可能顺序不对，下面理顺顺序，首先从第一条边界开始，找到x1,y1-->x2,y2，然后依次找后面的边界中顺着x2，y2的点的线，加入数组中，再继续进行。
    var last_x = border_lines[0].x2,
        last_y = border_lines[0].y2
    var points_order = [{ x: border_lines[0].x1, y: border_lines[0].y1 }, { x: border_lines[0].x2, y: border_lines[0].y2 }]
    var count = border_lines.length - 1
    border_lines[0].check = true
    while (count > 0) {
        for (let i = 1; i < border_lines.length; i++) {
            if (border_lines[i].check == true) continue
            if (border_lines[i].x1 == last_x && border_lines[i].y1 == last_y) {
                last_x = border_lines[i].x2
                last_y = border_lines[i].y2
                points_order.push({ x: last_x, y: last_y })
                border_lines[i].check = true
                count--
            } else if (border_lines[i].x2 == last_x && border_lines[i].y2 == last_y) {
                last_x = border_lines[i].x1
                last_y = border_lines[i].y1
                points_order.push({ x: last_x, y: last_y })
                border_lines[i].check = true
                count--
            }
        }
    }
    // 顺序已经理好，所有的顶点已经加入数组，下面在shape中绘制出截面
    // 顺便找到板子的中心
    let max_x = 0,
        min_x = 0,
        max_y = 0,
        min_y = 0
    for (let i in points_order) {
        if (points_order[i].x > max_x) max_x = points_order[i].x
        if (points_order[i].x < min_x) min_x = points_order[i].x
        if (points_order[i].y > max_y) max_y = points_order[i].y
        if (points_order[i].y < min_x) min_x = points_order[i].y

        if (i == 0) {
            shape.moveTo(points_order[i].x, points_order[i].y)
        } else {
            shape.lineTo(points_order[i].x, points_order[i].y)
        }
    }
    ldc.board = { center: { x: (max_x - min_x) / 2, y: (max_y - min_y) / 2 } }
        // 拉伸
    var extrudeSettings = { amount: 30, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
    var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    var mat = new THREE.MeshLambertMaterial({ color: 0x22b14c, transparent: true, opacity: 0.5 })
    ldc.board.mesh = new THREE.Mesh(geo, mat)
    ldc.board.mesh.receiveShadow = true

    ldc.holder.add(ldc.board.mesh)
}

function _renderScene() {
    ldc.orbit.update()
    requestAnimationFrame(_renderScene)
    ldc.renderer.render(ldc.scene, ldc.camera)
}

// 辅助函数，去除数组中的重复元素
function _unique(array) {
    var r = []
    for (var i = 0, l = array.length; i < l; i++) {
        for (var j = i + 1; j < l; j++)
            if (array[i] === array[j]) j = ++i
        r.push(array[i])
    }
    return r
}
