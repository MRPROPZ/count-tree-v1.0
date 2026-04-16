import { useState, useEffect, useRef } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [trees, setTrees] = useState(() => {
    const saved = localStorage.getItem("trees");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [plantDate, setPlantDate] = useState("");
  const [cutDate, setCutDate] = useState("");
  const [detail, setDetail] = useState("");
  const [image, setImage] = useState("");
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({name: false, plantDate: false, cutDate: false, detail: false});
  const [deleteAll, setDeleteAll] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [theme, setTheme] = useState("light");
  const [sortBy, setSortBy] = useState("");
  
  const nameRef = useRef(null);
  const plantDateRef = useRef(null);
  const cutDateRef = useRef(null);
  const detailRef = useRef(null);
  const importRef = useRef(null);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("trees", JSON.stringify(trees));
    }, [trees]
  );

  // Notification request
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Notify 1 day before cut
  useEffect(() => {
    trees.forEach((tree) => {
      const today = new Date();
      const cutDate = new Date(tree.cutDate);
      const diff = Math.ceil((cutDate - today) / (1000 * 60 * 60 * 24));

      // ถ้าเหลือ 1 วันและยังไม่เคยแจ้งเตือน
      if (diff === 1 && !tree.notified) {
        if (Notification.permission === "granted") {
          new Notification("🌱 เตือนวันตัดต้นไม้!", {
            body: `ต้นไม้ "${tree.name}" จะถึงวันตัดพรุ่งนี้!`,
            icon: tree.image || "/favicon.ico", // ใช้รูปต้นไม้ถ้ามี
          });
        }

        // อัปเดต tree ว่าแจ้งเตือนแล้ว
        setTrees(prev =>
          prev.map(t =>
            t.id === tree.id ? { ...t, notified: true } : t
          )
        );
      }
    });
  }, [trees]);

  useEffect(()=> {
    const handleEsc = (e) => {
    if (e.key === "Escape") {
      setShowForm(false);
      resetForm();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000); // 2 วินาทีหาย
  };

  const validateForm = () => {
    const newErrors = {
      name: !name.trim(),
      plantDate: !plantDate,
      cutDate: !cutDate,
      detail: !detail.trim(),
    };
    setErrors(newErrors);

    if (newErrors.name) {
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current?.focus();
      return false;
    }

    if (newErrors.plantDate) {
      plantDateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      plantDateRef.current?.focus();
      return false;
    }

    if (newErrors.cutDate) {
      cutDateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      cutDateRef.current?.focus();
      return false;
    }

    if (newErrors.detail) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      detailRef.current?.focus();
      return false;
    }

    return true;
  };

  const addTree = () => {
    if (!validateForm()) return;  // ถ้าไม่ครบ -> หยุด

    const newTree = {id: Date.now(), name, plantDate, cutDate, detail, image, notified: false};
    setTrees([...trees, newTree]);
    setEditId(null);
    setShowForm(false);
    setName("");
    setPlantDate("");
    setCutDate("");
    setDetail("");
    setImage("");
    showToast("เพิ่มต้นไม้สำเร็จ 🎉");
  };

  const deleteTree = (id) => {
    setTrees(trees.filter((t) => t.id !== id));
  };

  const countDays = (cutDate) => {
    const today = new Date();
    const cut = new Date(cutDate);

    // ล้างเวลา
    today.setHours(0,0,0,0);
    cut.setHours(0,0,0,0);

    const diff = Math.ceil((cut - today) / (1000 * 60 * 60 * 24));

    return diff <= 0 ? 0 : diff;
  };

  const editTree = (id) => {
    const tree = trees.find((t) => t.id === id);
    setName(tree.name);
    setPlantDate(tree.plantDate);
    setCutDate(tree.cutDate);
    setDetail(tree.detail);
    setImage(tree.image);
    setEditId(id);
    setShowForm(true);
  };

  const updateTree = () => {
    if (!validateForm()) return;

    setTrees(trees.map((t) => t.id === editId ? { id: editId, name, plantDate, cutDate, detail, image }: t));
    setEditId(null);
    setShowForm(false);
    setName("");
    setPlantDate("");
    setCutDate("");
    setDetail("");
    setImage("");
    showToast("แก้ไขต้นไม้สำเร็จ 🎉");
  };

  const resetForm = () => {
    setName("");
    setPlantDate("");
    setCutDate("");
    setDetail("");
    setImage("");
    setErrors({ name: false, plantDate: false, cutDate: false, detail: false });
    setEditId(null); // สำหรับกรณี edit
  }

  const exportData = () => {
    const json = JSON.stringify(trees, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trees_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export สำเร็จ 📦");
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error();
        setTrees(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newItems = data.filter(t => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        showToast(`Import สำเร็จ ${data.length} รายการ 📥`);
      } catch {
        showToast("ไฟล์ไม่ถูกต้อง ❌", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Filter & sort
  const filteredTrees = [...trees]
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      const daysLeft = countDays(t.cutDate);
      if (statusFilter === "due") return daysLeft <= 0;
      if (statusFilter === "notDue") return daysLeft > 0;
      return true;
    })
    .sort((a, b) => {

      if (sortBy === "plantDate") {
        return new Date(a.plantDate) - new Date(b.plantDate);
      }

      if (sortBy === "cutDate") {
        return new Date(a.cutDate) - new Date(b.cutDate);
      }

      if (sortBy === "daysLeft") {
        return countDays(a.cutDate) - countDays(b.cutDate);
      }

      return 0;
    });

  if (sortBy === "plantDate") filteredTrees.sort((a,b)=> new Date(a.plantDate)-new Date(b.plantDate));
  else if (sortBy === "cutDate") filteredTrees.sort((a,b)=> new Date(a.cutDate)-new Date(b.cutDate));
  else if (sortBy === "daysLeft") filteredTrees.sort((a,b)=> countDays(a.cutDate)-countDays(b.cutDate));

  return (
    <div className={`${theme === "light" ? "bg-green-50 text-black" : "bg-gray-900 text-white"} min-h-screen p-4 transition-colors duration-300`}>
      {/* Header + ปุ่มธีม*/}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700 dark:text-green-300 drop-shadow">🌱 โปรแกรมนับวันตัดต้นไม้</h1>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl cursor-pointer"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 text-base font-semibold min-w-[220px] justify-center animate-fade-in">
          {toast}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl text-center">
            <p className="mb-4 font-semibold text-gray-700">คุณแน่ใจว่าต้องการลบต้นไม้นี้ไหม?</p>
            <div className="flex justify-between gap-4">
              <button
                onClick={() => {
                  deleteTree(deleteId);   // ลบจริง
                  setDeleteId(null);       // ปิด modal
                  showToast("ลบสำเร็จ 🎉"); // แสดง toast
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl cursor-pointer"
              >
                ลบ
              </button>
              <button
                onClick={() => setDeleteId(null)} // กดยกเลิก → ปิด modal
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

        {deleteAll && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full shadow-xl text-center">
              <p className="mb-4 font-semibold text-gray-700">คุณแน่ใจว่าต้องการล้างต้นไม้ทั้งหมดไหม?</p>
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => {
                    setTrees([]);    // ล้างต้นไม้ทั้งหมด
                    setDeleteAll(false); // ปิด modal
                    showToast("ล้างต้นไม้ทั้งหมดแล้ว 🎉");
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
                <button
                  onClick={() => setDeleteAll(false)} // ปิด modal
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="mx-auto mb-6 space-y-3">
        
        {/* แถวบน */}
        <div className="flex flex-col sm:flex-row gap-4">

          <input type="text" placeholder="🔍 ค้นหาต้นไม้ตามชื่อ..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-green-300 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 placeholder-gray-500"
        />

          {/* เรียง */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-3 border shadow-sm rounded-2xl focus:ring-2 focus:ring-green-300 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-pointer"
          >
            <option value="">เรียงตาม</option>
            <option value="plantDate">วันที่ปลูก</option>
            <option value="cutDate">วันที่ตัด</option>
            <option value="daysLeft">เหลือวันน้อย → มาก</option>
          </select>

          {/* กรอง */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-3 border rounded-2xl shadow-sm focus:ring-2 focus:ring-green-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white cursor-pointer">
            <option value="all">ทั้งหมด</option>
            <option value="due">ครบกำหนดแล้ว</option>
            <option value="notDue">ยังไม่ครบกำหนด</option>
          </select>

          {/* ปุ่ม Grid/List */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="px-4 py-3 bg-green-500 shadow-md hover:scale-105 text-white rounded-2xl transition cursor-pointer"
          >
            {viewMode === "grid" ? "🗒️ List" : "🔲 Grid"}
          </button>
        </div>
      </div>

      {/*เพิ่มต้นไม้และลบต้นไม้*/}
      <div className="flex justify-center gap-4 mb-4">
        <button onClick={() => {setShowForm(true); resetForm();}} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transition duration-200 cursor-pointer">➕ เพิ่มต้นไม้</button>
        <button onClick={() => setDeleteAll(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transition duration-200 cursor-pointer"> 🗑️ ล้างทั้งหมด</button>
        <button onClick={exportData} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transition duration-200 cursor-pointer">📦 Export</button>
        <button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transition duration-200 cursor-pointer flex items-center justify-center"
          onClick={() => importRef.current.click()}
        >
          📥 Import
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importData} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-500"
        onClick={() => {setShowForm(false); resetForm();}}>
          <div className="bg-white p-5 rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in max-h-[80vh] p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}> 
          
            <h2 className="text-xl font-bold mb-4">{editId ? "แก้ไขต้นไม้" : "เพิ่มต้นไม้"}</h2>

            <div ref={nameRef}>
              <p className={`text-black-500 text-sm errors.name ?`}>ชื่อต้นไม้</p>
              <input type="text" placeholder="ชื่อต้นไม้" value={name} onChange={(e) => setName(e.target.value)} 
                className={`w-full p-2 mb-3 border rounded-lg focus:ring-2 focus:ring-green-300
                ${errors.name ? "border-red-500 focus:ring-red-300" : "border-gray-300"}}`}
              />
            </div>
            
            <div ref={plantDateRef}>
              <p className="text-black-500 text-sm">วันที่ปลูก</p>
              <input  type="date" value={plantDate} onChange={(e) => setPlantDate(e.target.value)}
                className={`w-full p-2 mb-3 border rounded-lg focus:ring-2 focus:ring-green-300
                ${errors.name ? "border-red-500 focus:ring-red-300" : "border-gray-300"}}`}
              />
            </div>
            
            <div ref={cutDateRef}>
              <p className="text-black-500 text-sm">วันที่ตัด</p>
              <input type="date" value={cutDate} onChange={(e) => setCutDate(e.target.value)}
                className={`w-full p-2 mb-3 border rounded-lg focus:ring-2 focus:ring-green-300
                ${errors.cutDate ? "border-red-500 focus:ring-red-300" : "border-gray-300"}}`}
              />
            </div>

            <div ref={detailRef}>
              <p className="text-black-500 text-sm">รายละเอียด</p>
              <textarea ref={detailRef} placeholder="รายละเอียด" value={detail} onChange={(e) => setDetail(e.target.value)} 
                className={`w-full p-2 mb-3 border rounded-lg focus:ring-2 focus:ring-green-300
                ${errors.cutDate ? "border-red-500 focus:ring-red-300" : "border-gray-300"}}`}
              />      
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-semibold text-gray-700">รูปต้นไม้</label>
              <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition-all relative overflow-hidden" 
                onClick={() => document.getElementById("imageInput").click()} 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setImage(reader.result);
                  reader.readAsDataURL(file);
                  }
                }}
                >

                {image ? (
                  <img src={image} alt="preview" className="object-cover w-full h-full rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <p className="text-gray-400">คลิกเพื่ออัปโหลดรูป หรือ ลากรูปมาที่นี่</p>
                  </div>
                )}
                <input type="file" id="imageInput" className="hidden" accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setImage(reader.result);
                      reader.readAsDataURL(file);
                      e.target.value = ""
                    }
                  }}
                />
              </div>
            </div>
            <button 
              onClick={editId ? updateTree : addTree}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold transition duration-200 cursor-pointer"
            >
              {editId ? "อัปเดต" : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Tree Cards */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6  mx-auto" : "flex flex-col space-y-4 mt-6  mx-auto"}>
        {filteredTrees.map((tree) => {
          const daysLeft = countDays(tree.cutDate);
          let color = "text-green-600";
          if (daysLeft <= 7 && daysLeft > 0) color = "text-red-500"; // ใกล้วันตัด
          else if (daysLeft <= 30 && daysLeft > 7) color = "text-yellow-500";
          else if (daysLeft === 0) color = "text-gray-400"; // ครบกำหนดแล้ว

          return (
            <div key={tree.id} className={`${theme==="light"?"bg-white":"bg-gray-800"} rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition duration-200 ${viewMode==="list"?"flex":"block"}`}>
              {tree.image && <img src={tree.image} className={viewMode === "grid" ? "w-full h-40 object-cover" : "w-32 h-32 object-cover mr-4"}/>}
              <div classname="flex flex-col justify-between h-full">
                <h2 className="font-bold text-lg">🌱 {tree.name}</h2>
                <p className={color}>⏱️ {daysLeft > 0 ? `เหลืออีก ${daysLeft} วัน` : "ครบกำหนดแล้ว"}</p>
                <p className={`${theme === "light" ? "text-gray-400" : "text-gray-300"} text-sm`}>{tree.detail}</p>

                <div className="flex gap-2 mt-3 h-10 w-full">
                  <button onClick={() => editTree(tree.id)} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer">✏️ แก้ไข</button>
                  <button onClick={() => setDeleteId(tree.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer">🗑️ ลบ</button>
                </div>
              </div>
            </div> 
          );
        })}
      </div>
    </div>
  );
}

export default App;