var ldc = {'Components': [], 'Pads': [], 'Outlines': []}

function load_pcb_data () {
  let filename = $('#pcb-file-select').val()
  let fullname = '../pcb/' + filename + '.pcb'

  ldc['Components']= []
  ldc['Pads']= []
  ldc['Outlines']=[]

  jQuery.get(fullname, function (data) {
    var lines = data.split('\n')
    for (var i in lines) { // 每行
      var properties = lines[i].split('|'); // 每个属性之间用|来分割
      var obj = {}
      for (var j in properties) {
        if (properties[j]) { // 如果属性存在
          var key, value
          var kv = properties[j].split('=')
          key = kv[0]; value = kv[1]
          // console.log(key+":"+value)
          obj[key] = value
        }
      }
      if (obj === {})continue
      switch (obj['RECORD']) {
        case 'Component': {
          ldc.Components.push(obj)
          break
        }
        case 'Pad': {
          ldc.Pads.push(obj)
          break
        }
        case 'Fill':
        case 'Track':
        case 'Arc': {
          switch (obj['LAYER']) {
            case 'KEEPOUT':
              // case 'MECHANICAL4':
              ldc.Outlines.push(obj)
              break
          }
          break
        }
      }
    }
    // 生成表格
    // generate_all_table()

    // enable draw button
    // $('#load_pcb_btn').attr('disabled', 'disabled').removeClass('btn-info').addClass('btn-default')
    $('#draw_pcb_btn').removeAttr('disabled').removeClass('btn-default').addClass('btn-info')
  })
}

function generate_all_table () {
  // --元器件表格
  generate_table('components-table', ldc.Components,
    { '序号': 'ID',
      '所在图层': 'LAYER',
      '封装类型': 'PATTERN',
      'X': 'X',
      'Y': 'Y',
      '旋转角': 'ROTATION'
    })
  // --焊盘表格
  generate_table('pad-table', ldc.Pads,
    { '所属元器件': 'COMPONENT',
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
  generate_table('outline-table', ldc.Outlines,
    { '类型': 'RECORD',
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
function generate_table (tag, array, fields) {
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
        }else {
          str += '<td>' + key + ':' + value + '</td>'
        }
      }
      str += '</tr>'
    }
    str += '</table>'
    $('#' + tag).html(str)
  }
}

// 绘制电路板外形
function add_pcb_board () {
  var shape = new THREE.Shape() // 创建Shape对象，作为电路板的平面截面，后继进行拉伸
  var border_lines = [] // 保存电路板外形的各个边界线
  // 以下循环将各个边界数据放入数组中
  for (let i = 0;i < ldc.Outlines.length;i++) {
    var s = ldc.Outlines[i]
    switch (s['RECORD']) {
      case 'Track': {
        var x1 = parseFloat(s['X1']), y1 = parseFloat(s['Y1']), x2 = parseFloat(s['X2']), y2 = parseFloat(s['Y2'])
        border_lines.push({x1: x1, y1: y1, x2: x2, y2: y2, check: false})
      }
      break
    }
  }

  // 边界线可能顺序不对，下面理顺顺序，首先从第一条边界开始，找到x1,y1-->x2,y2，然后依次找后面的边界中顺着x2，y2的点的线，加入数组中，再继续进行。
  var last_x = border_lines[0].x2, last_y = border_lines[0].y2
  var points_order = [{x: border_lines[0].x1, y: border_lines[0].y1}, {x: border_lines[0].x2,y: border_lines[0].y2}]
  var count = border_lines.length - 1
  border_lines[0].check = true
  while(count > 0){
    for (let i = 1; i < border_lines.length; i++) {
      if (border_lines[i].check == true) continue
      if (border_lines[i].x1 == last_x && border_lines[i].y1 == last_y) {
        last_x = border_lines[i].x2
        last_y = border_lines[i].y2
        points_order.push({x: last_x, y: last_y})
        border_lines[i].check = true
        count--
      }else if (border_lines[i].x2 == last_x && border_lines[i].y2 == last_y) {
        last_x = border_lines[i].x1
        last_y = border_lines[i].y1
        points_order.push({x: last_x, y: last_y})
        border_lines[i].check = true
        count--
      }
    }
  }
  // 顺序已经理好，所有的顶点已经加入数组，下面在shape中绘制出截面
  // 顺便找到板子的中心
  let max_x = 0,min_x = 0,max_y = 0,min_y = 0
  for (let i in points_order) {
    if (points_order[i].x > max_x)max_x = points_order[i].x
    if (points_order[i].x < min_x)min_x = points_order[i].x
    if (points_order[i].y > max_y)max_y = points_order[i].y
    if (points_order[i].y < min_x)min_x = points_order[i].y

    if (i == 0) {
      shape.moveTo(points_order[i].x, points_order[i].y)
    }else {
      shape.lineTo(points_order[i].x, points_order[i].y)
    }
  }
  ldc.board = {center: {x: (max_x - min_x) / 2, y: (max_y - min_y) / 2}}
  // 拉伸
  var extrudeSettings = { amount: 30, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
  var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  var mat = new THREE.MeshPhongMaterial({color: 0x22b14c})
  ldc.board.mesh = new THREE.Mesh(geo, mat)
  ldc.board.mesh.receiveShadow = true

  ldc.scene.add(ldc.board.mesh)
}

// 绘制焊盘
function add_pcb_pad () {
  let material = new THREE.MeshPhongMaterial({color: 0xcfcfcf})
  var extrudeSettings = { amount: 10, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }

  for (let i in ldc.Pads) {
    switch (ldc.Pads[i]['SHAPE']) {
      case 'ROUND': // 圆形的焊盘
        {
        break
      }
      case 'RECTANGLE': // 方形焊盘
        {
        let x = parseFloat(ldc.Pads[i]['X']),
          y = parseFloat(ldc.Pads[i]['Y']),
          xsize = parseFloat(ldc.Pads[i]['XSIZE']),
          ysize = parseFloat(ldc.Pads[i]['YSIZE']),
          rotation = parseFloat(ldc.Pads[i]['ROTATION'])

        let shape = new THREE.Shape()
        shape.moveTo(0 - xsize / 2, 0 - ysize / 2)
        shape.lineTo(0 + xsize / 2, 0 - xsize / 2)
        shape.lineTo(0 + xsize / 2, 0 + ysize / 2)
        shape.lineTo(0 - xsize / 2, 0 + ysize / 2)
        let geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
        let pad = new THREE.Mesh(geo, material)
        pad.rotation.z = rotation * Math.PI / 180.0
        pad.name = 'pad-' + ldc.Pads[i]['NAME']
        pad.position.set(x, y, 30)
        pad.castShadow = true
        ldc.scene.add(pad)
        console.log('x:' + x + ',y:' + y + ',xsize:' + xsize + ',ysize:' + ysize + ',angle:' + rotation)
        break
      }
    }
  }
}

function draw_pcb () {
  if (ldc.scene === undefined) {
    ldc.scene = new THREE.Scene()
  }else {
    let obj, i
    for (i = ldc.scene.children.length - 1; i >= 0; i--) {
      obj = ldc.scene.children[ i ]
      if (obj.type === "Mesh") {
        ldc.scene.remove(obj)
      }
    }
  }
  // ldc.ambientLight = new THREE.AmbientLight({color: 0xffffff})
  // ldc.scene.add(ldc.ambientLight)



  if (ldc.renderer === undefined) {
    ldc.camera = new THREE.PerspectiveCamera(45,
      window.innerWidth / window.innerHeight,
      0.1,
      100000)

    ldc.renderer = new THREE.WebGLRenderer({antialias: true})
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
    ldc.spotLight.position.set(0, 0, 10000)
    ldc.spotLight.castShadow = true
    ldc.scene.add(ldc.spotLight)
  }

  add_pcb_board(); // 绘制PCB板外形
  add_pcb_pad()

  // var spotLightHelper = new THREE.SpotLightHelper(ldc.spotLight)
  // ldc.scene.add(spotLightHelper)

  ldc.camera.position.set(0, 0, 10000)
  ldc.camera.lookAt(ldc.scene.position)

  renderScene()
}

function renderScene () {
  ldc.orbit.update()
  requestAnimationFrame(renderScene)
  ldc.renderer.render(ldc.scene, ldc.camera)
}

// 辅助函数，去除数组中的重复元素
function unique (array) {
  var r = []
  for (var i = 0, l = array.length; i < l; i++) {
    for (var j = i + 1; j < l; j++)
      if (array[i] === array[j]) j = ++i
    r.push(array[i])
  }
  return r
}
